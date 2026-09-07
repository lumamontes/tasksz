/**
 * Analytics utility (application layer).
 *
 * Optional PostHog + Google Analytics 4, strictly gated by env vars:
 * nothing is loaded or sent when the keys are unset — the default local-first
 * build ships track-free. posthog-js is only fetched at runtime when
 * PUBLIC_POSTHOG_KEY/HOST are configured.
 *
 * Tracking only ever activates in production builds (`astro build`): the
 * import.meta.env.PROD guard below means `astro dev` stays completely
 * track-free even if keys are present in .env.
 */

interface PostHogLike {
  init(key: string, options?: Record<string, unknown>): void;
  capture(event: string, props?: Record<string, unknown>): void;
}

const posthogKey = import.meta.env.PUBLIC_POSTHOG_KEY as string | undefined;
const posthogHost = import.meta.env.PUBLIC_POSTHOG_HOST as string | undefined;
const ga4Id = import.meta.env.PUBLIC_GA4_MEASUREMENT_ID as string | undefined;

interface WindowWithAnalytics extends Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;
let posthogPromise: Promise<PostHogLike> | null = null;

function loadPostHog(): Promise<PostHogLike> {
  if (!posthogPromise && posthogKey && posthogHost) {
    posthogPromise = import('posthog-js').then((mod) => mod.default as unknown as PostHogLike);
  }
  return posthogPromise ?? Promise.reject(new Error('PostHog não configurado'));
}

/**
 * Initialize analytics. Called once on app start. Injects vendor scripts only
 * when the matching env vars are present.
 */
export function initAnalytics(): void {
  // Production builds only: never load trackers in `astro dev`, even if env
  // keys are present. import.meta.env.PROD is statically inlined per mode.
  if (typeof window === 'undefined' || initialized || !import.meta.env.PROD) return;
  initialized = true;

  if (posthogKey && posthogHost) {
    loadPostHog().then((posthog) => {
      posthog.init(posthogKey!, {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: false,
        loaded: () => {
          posthog.capture('$pageview');
        },
      });
    });
  }

  if (ga4Id) {
    const win = window as WindowWithAnalytics;
    win.dataLayer = win.dataLayer || [];
    win.gtag = function gtag(...args: unknown[]) {
      win.dataLayer!.push(args);
    };
    // Load the GA4 loader script.
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
    document.head.appendChild(s);
    win.gtag('js', new Date() as unknown as string);
    win.gtag('config', ga4Id);
  }
}

export interface AnalyticsProps {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Track an event across all enabled providers. No-op when analytics is
 * unconfigured, so feature code can safely call it unconditionally.
 */
export function trackEvent(name: string, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;
  // Never send events from local/dev builds, even if env keys are present.
  if (!import.meta.env.PROD) return;

  if (posthogKey && posthogHost) {
    loadPostHog().then((posthog) => {
      try {
        posthog.capture(name, props ?? {});
      } catch {
        // Analytics must never break app behavior.
      }
    });
  }

  if (ga4Id) {
    const win = window as WindowWithAnalytics;
    if (typeof win.gtag === 'function') {
      win.gtag('event', name, props ?? {});
    }
  }
}
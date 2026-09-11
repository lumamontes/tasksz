# ADR-006: Privacy-first optional analytics

- **Status:** Accepted
- **Date:** 2026-09-11

## Context

Tarefitas is local-first and should not silently introduce network tracking.
Analytics can help evaluate the published product, but it must not be part of
the required application path or the local development experience.

## Decision

Load PostHog and Google Analytics 4 only when their corresponding public
environment variables are configured. Initialize and send events only in
production builds. Keep analytics calls non-blocking and failure-isolated so a
vendor outage cannot affect task management, authentication, or sync.

PostHog pageview capture is explicit, and the application owns the shared
analytics initialization rather than each page loading trackers independently.
When analytics variables are absent, the build remains track-free.

## Consequences

- Local development does not send analytics, even if production keys exist in
  another environment.
- Deployments can opt into analytics without changing feature code.
- Privacy behavior is controlled by deployment configuration and documented in
  the public privacy policy.
- Analytics must never be used as a dependency for product behavior.

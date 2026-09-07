/**
 * Pomodoro Store
 * Shared, timestamp-based countdown used by every pomodoro UI (center panel,
 * focus mode, popup window). All timing is derived from an end timestamp so the
 * countdown never drifts and survives tab throttling / window reloads.
 */

import { atom } from 'nanostores';
import { $settings } from './settingsStore';
import { trackEvent } from '../utils/analytics';

export type PomodoroMode = 'focus' | 'break' | 'longBreak';

const STORAGE_KEY = 'tarefitas_v1_pomodoroState';
const MAX_STALE_MS = 60_000; // Ignore saved state older than one minute

const FALLBACK_MINUTES: Record<PomodoroMode, number> = {
  focus: 25,
  break: 5,
  longBreak: 15,
};

// Public state
export const $minutes = atom(25);
export const $seconds = atom(0);
export const $mode = atom<PomodoroMode>('focus');
export const $isActive = atom(false);
export const $hasFinished = atom(false);
export const $completedFocusSessions = atom(0);

// Internal timing
let timerInterval: number | null = null;
let endsAt = 0;

export function getDurationMinutes(mode: PomodoroMode): number {
  const settings = $settings.get();
  const pomodoro = settings.pomodoro;
  switch (mode) {
    case 'focus':
      return pomodoro.focusMinutes;
    case 'break':
      return pomodoro.shortBreakMinutes;
    case 'longBreak':
      return pomodoro.longBreakMinutes;
    default:
      return FALLBACK_MINUTES[mode];
  }
}

function remainingSeconds(): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function applyRemaining() {
  const total = remainingSeconds();
  $minutes.set(Math.floor(total / 60));
  $seconds.set(total % 60);
}

function stopInterval() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * What the next mode will be after the current one. Always derived from
 * `$completedFocusSessions`, which is incremented when a focus session ends —
 * so UI labels and the `nextMode()` action can never disagree.
 */
export function getNextMode(): PomodoroMode {
  if ($mode.get() === 'focus') {
    return $completedFocusSessions.get() % 4 === 0 ? 'longBreak' : 'break';
  }
  return 'focus';
}

export function setMode(mode: PomodoroMode) {
  if ($isActive.get()) return;
  stopInterval();
  $mode.set(mode);
  $hasFinished.set(false);
  $minutes.set(getDurationMinutes(mode));
  $seconds.set(0);
}

export function startCountdown() {
  if ($isActive.get()) return;
  stopInterval();

  const remaining = $minutes.get() * 60 + $seconds.get();
  if (remaining <= 0) {
    $minutes.set(getDurationMinutes($mode.get()));
    $seconds.set(0);
  }
  endsAt = Date.now() + ($minutes.get() * 60 + $seconds.get()) * 1000;

  $hasFinished.set(false);
  $isActive.set(true);

  trackEvent('pomodoro_started', { mode: $mode.get() });

  timerInterval = window.setInterval(() => {
    if (remainingSeconds() <= 0) {
      finishMode();
      return;
    }
    applyRemaining();
  }, 500);
}

export function pauseCountdown() {
  if (!$isActive.get()) return;
  applyRemaining();
  stopInterval();
  $isActive.set(false);
}

export function resetCountdown() {
  stopInterval();
  $isActive.set(false);
  $hasFinished.set(false);
  $minutes.set(getDurationMinutes($mode.get()));
  $seconds.set(0);
}

export function nextMode() {
  setMode(getNextMode());
}

function finishMode() {
  stopInterval();
  $isActive.set(false);
  $hasFinished.set(true);
  $minutes.set(0);
  $seconds.set(0);

  if ($mode.get() === 'focus') {
    $completedFocusSessions.set($completedFocusSessions.get() + 1);
  }

  trackEvent('pomodoro_finished', { mode: $mode.get() });

  notifyFinished();
}

/**
 * Short, soft chime played when a session ends and sounds are enabled.
 * Pure Web Audio — no audio assets required.
 */
function playFinishChime() {
  if (typeof window === 'undefined' || !window.AudioContext) return;

  try {
    const audioContext = new AudioContext();
    const now = audioContext.currentTime;

    // Gentle three-note arpeggio (C5-E5-G5), soft by design.
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.18);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.7);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.75);
    });

    window.setTimeout(() => audioContext.close(), 2000);
  } catch {
    // Audio is optional — never let it break the timer.
  }
}

function notifyFinished() {
  if (typeof window === 'undefined') return;
  if (!$settings.get().soundEnabled) return;

  playFinishChime();

  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const finishingFocus = $mode.get() === 'focus';
  try {
    const next = getNextMode();
    new Notification(
      finishingFocus ? 'Sessão de foco concluída' : 'Pausa finalizada',
      {
        body: finishingFocus
          ? `Hora da ${next === 'longBreak' ? 'pausa longa' : 'pausa curta'}`
          : 'Pronto para focar novamente?',
        silent: true,
      },
    );
  } catch {
    // Notifications are optional — never let them break the timer.
  }
}

// --- Persistence (cross-window sync + reload recovery) ----------------------

function safeWrite(secondsRemaining: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        secondsRemaining,
        mode: $mode.get(),
        isActive: $isActive.get(),
        hasFinished: $hasFinished.get(),
        completedFocusSessions: $completedFocusSessions.get(),
        timestamp: Date.now(),
      }),
    );
  } catch {
    // Storage can be unavailable (private mode); persistence is best-effort.
  }
}

export function loadPomodoroState() {
  if (typeof window === 'undefined') return false;

  let state: {
    secondsRemaining?: number;
    mode?: PomodoroMode;
    isActive?: boolean;
    hasFinished?: boolean;
    completedFocusSessions?: number;
    timestamp?: number;
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    state = JSON.parse(raw);
  } catch {
    return false;
  }

  if (!state.secondsRemaining || Date.now() - (state.timestamp || 0) > MAX_STALE_MS) {
    return false;
  }

  if (state.mode) $mode.set(state.mode);
  $minutes.set(Math.floor(state.secondsRemaining / 60));
  $seconds.set(state.secondsRemaining % 60);
  $hasFinished.set(!!state.hasFinished);
  $completedFocusSessions.set(state.completedFocusSessions || 0);

  // Only resume a timer that was mid-run and still fresh.
  if (state.isActive && !state.hasFinished && !timerInterval && !$isActive.get()) {
    endsAt = Date.now() + state.secondsRemaining * 1000;
    $isActive.set(true);
    timerInterval = window.setInterval(() => {
      if (remainingSeconds() <= 0) {
        finishMode();
        return;
      }
      applyRemaining();
    }, 500);
  }
  return true;
}

if (typeof window !== 'undefined') {
  let saveTimer: number | null = null;
  const scheduleSave = () => {
    if (saveTimer !== null) return;
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      safeWrite($minutes.get() * 60 + $seconds.get());
    }, 200);
  };

  $minutes.subscribe(scheduleSave);
  $seconds.subscribe(scheduleSave);
  $mode.subscribe(scheduleSave);
  $isActive.subscribe(scheduleSave);
  $hasFinished.subscribe(scheduleSave);
  $completedFocusSessions.subscribe(scheduleSave);

  // Keep multiple open windows in sync.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    let state: {
      secondsRemaining?: number;
      mode?: PomodoroMode;
      isActive?: boolean;
      hasFinished?: boolean;
      completedFocusSessions?: number;
      timestamp?: number;
    };
    try {
      state = JSON.parse(e.newValue);
    } catch {
      return;
    }
    if (Date.now() - (state.timestamp || 0) > MAX_STALE_MS) return;

    if (state.mode) $mode.set(state.mode);
    if (state.secondsRemaining) {
      $minutes.set(Math.floor(state.secondsRemaining / 60));
      $seconds.set(state.secondsRemaining % 60);
    }
    $hasFinished.set(!!state.hasFinished);
    $completedFocusSessions.set(state.completedFocusSessions || 0);

    if (state.isActive && !$isActive.get() && !timerInterval) {
      endsAt = Date.now() + state.secondsRemaining! * 1000;
      $isActive.set(true);
      timerInterval = window.setInterval(() => {
        if (remainingSeconds() <= 0) {
          finishMode();
          return;
        }
        applyRemaining();
      }, 500);
    } else if (!state.isActive && $isActive.get()) {
      pauseCountdown();
    }
  });

  window.addEventListener('beforeunload', () => {
    stopInterval();
    safeWrite($minutes.get() * 60 + $seconds.get());
  });
}
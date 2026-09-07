/**
 * FloatingPomodoro Component
 * Detached mini pomodoro: an expandable bubble pinned to the screen so the
 * countdown stays visible while you work elsewhere in the app.
 *
 * Design intent (decluttered, one clear action):
 * - The pill is the always-on timeout. It shows only what's essential while
 *   working: elapsed ring + time + mode. It can be dragged to any edge
 *   (position persisted), and Space toggles start/pause from anywhere.
 * - The popover is a calm sheet attached to the pill (with a little caret).
 *   Hierarchy: session label (soft) → large time → lean cycle whisper →
 *   ONE primary action that always reads as the next step, plus a quiet reset
 *   icon. Keyboard/gesture hints surface only on hover of the pill, not as a
 *   permanent footer.
 */

import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  $minutes,
  $seconds,
  $mode,
  $isActive,
  $hasFinished,
  $completedFocusSessions,
  getDurationMinutes,
  getNextMode,
  startCountdown,
  pauseCountdown,
  resetCountdown,
  nextMode,
  type PomodoroMode,
} from '../../stores/pomodoroStore';
import { $settings } from '../../stores/settingsStore';
import { useStoreInit } from '../../hooks/useStoreInit';
import { RotateCcw, Play, Pause, X } from 'lucide-react';

const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: 'Foco',
  break: 'Pausa',
  longBreak: 'Pausa Longa',
};

const POMODORO_POS_KEY = 'tarefitas_v1_pomodoroPos';
const DRAG_THRESHOLD_PX = 5;

function formatTime(minutes: number, seconds: number): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(minutes)}:${pad(seconds)}`;
}

/** Position as distance from the viewport bottom-right corner (CSS `right`/`bottom`). */
interface PillPosition {
  right: number;
  bottom: number;
}

const DEFAULT_POSITION: PillPosition = { right: 16, bottom: 16 };

function loadPosition(): PillPosition {
  if (typeof window === 'undefined') return DEFAULT_POSITION;
  try {
    const raw = window.localStorage.getItem(POMODORO_POS_KEY);
    if (!raw) return DEFAULT_POSITION;
    const parsed = JSON.parse(raw) as Partial<PillPosition>;
    const right = typeof parsed.right === 'number' && isFinite(parsed.right) ? parsed.right : DEFAULT_POSITION.right;
    const bottom = typeof parsed.bottom === 'number' && isFinite(parsed.bottom) ? parsed.bottom : DEFAULT_POSITION.bottom;
    return { right, bottom };
  } catch {
    return DEFAULT_POSITION;
  }
}

export function FloatingPomodoro() {
  const minutes = useStore($minutes);
  const seconds = useStore($seconds);
  const mode = useStore($mode);
  const isActive = useStore($isActive);
  const hasFinished = useStore($hasFinished);
  const completedSessions = useStore($completedFocusSessions);
  const settings = useStore($settings);

  useStoreInit({ pomodoro: true });

  const [expanded, setExpanded] = useState(false);
  const [position, setPosition] = useState<PillPosition>(loadPosition);
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startRight: number;
    startBottom: number;
    moved: boolean;
  } | null>(null);
  /** True right after a drag ends, so the click that follows doesn't toggle. */
  const suppressClickRef = useRef(false);
  /** Whether the user is hovering the bubble (to reveal the gesture hint). */
  const [hovering, setHovering] = useState(false);

  const total = getDurationMinutes(mode) * 60;
  const remaining = minutes * 60 + seconds;
  const inProgress = remaining < total;
  const elapsedPct = total > 0 ? Math.min(100, Math.max(0, ((total - remaining) / total) * 100)) : 0;

  // Only show once a session has actually started (avoid a permanent pill).
  const visible = isActive || hasFinished || inProgress;

  // Close the popover when clicking outside.
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [expanded]);

  const persistPosition = (pos: PillPosition) => {
    try {
      window.localStorage.setItem(POMODORO_POS_KEY, JSON.stringify(pos));
    } catch {
      // Storage can be unavailable; drag persistence is best-effort.
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const rect = pillRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: position.right,
      startBottom: position.bottom,
      moved: false,
    };
    pillRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;

    const margin = 8;
    const right = Math.min(
      Math.max(margin, drag.startRight - dx),
      window.innerWidth - 72,
    );
    const bottom = Math.min(
      Math.max(margin, drag.startBottom - dy),
      window.innerHeight - 72,
    );
    setPosition({ right, bottom });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const drag = dragStateRef.current;
    if (!drag) return;
    pillRef.current?.releasePointerCapture(e.pointerId);
    dragStateRef.current = null;

    if (drag.moved) {
      suppressClickRef.current = true;
      const margin = 8;
      const finalRight = Math.min(
        Math.max(margin, drag.startRight - (e.clientX - drag.startX)),
        window.innerWidth - 72,
      );
      const finalBottom = Math.min(
        Math.max(margin, drag.startBottom - (e.clientY - drag.startY)),
        window.innerHeight - 72,
      );
      setPosition({ right: finalRight, bottom: finalBottom });
      persistPosition({ right: finalRight, bottom: finalBottom });
    }
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setExpanded((open) => !open);
  };

  // Keyboard: Space toggles start/pause, Escape collapses. Ignored while an
  // input/textarea/contentEditable is focused.
  const toggleTimer = useCallback(() => {
    if (hasFinished) {
      nextMode();
      setExpanded(false);
    } else if (isActive) {
      pauseCountdown();
    } else {
      startCountdown();
    }
  }, [hasFinished, isActive]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.code === 'Space' && visible) {
        e.preventDefault();
        toggleTimer();
      } else if (e.key === 'Escape') {
        if (expanded) setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleTimer, visible, expanded]);

  const cycleCompleted = completedSessions % 4;
  const inLongBreak = mode === 'longBreak' && completedSessions > 0;

  if (!visible) return null;

  const ringBg = isActive || inProgress
    ? `conic-gradient(currentColor ${elapsedPct}%, rgba(128,128,128,0.25) ${elapsedPct}%)`
    : 'none';

  // The one clear action: always the next step.
  const primaryAction = hasFinished
    ? { label: `Iniciar ${MODE_LABEL[getNextMode()]}`, run: () => { nextMode(); setExpanded(false); } }
    : isActive
      ? { label: 'Pausar', run: pauseCountdown, icon: Pause }
      : { label: inProgress ? 'Retomar' : 'Iniciar', run: startCountdown, icon: Play };

  const PrimaryIcon = primaryAction.icon;

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="fixed z-40 flex flex-col items-end"
      style={{ right: position.right, bottom: position.bottom }}
    >
      {/* Popover sheet — appears above the pill, attached with a caret */}
      {expanded && (
        <div className="mb-2 relative animate-[fadeIn_0.16s_ease-out]">
          <div className="bg-theme-sidebar/95 backdrop-blur-sm border border-theme-border rounded-2xl shadow-xl px-5 py-4 w-[240px] text-center">
            {/* Session whisper (soft) */}
            <p className="text-xs font-medium uppercase tracking-wider text-theme-muted">
              {mode === 'focus'
                ? `Sessão de foco ${completedSessions + 1}`
                : inLongBreak
                  ? 'Pausa longa'
                  : MODE_LABEL[mode]}
            </p>

            {/* Time (the hero) */}
            <p className="mt-2 text-5xl font-mono font-bold text-theme-text tabular-nums leading-none">
              {formatTime(minutes, seconds)}
            </p>

            {/* Cycle whisper — minimal, only during focus/break rhythm */}
            {mode === 'focus' && (
              <div
                className="mt-3 flex items-center justify-center gap-1.5"
                aria-label={`Foco ${cycleCompleted} de 4`}
              >
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      i < cycleCompleted || hasFinished ? 'bg-theme-accent' : 'bg-theme-border'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}

            {/* One primary action + quiet reset */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={primaryAction.run}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-theme-accent hover:opacity-90 text-white text-sm font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent"
              >
                {PrimaryIcon && <PrimaryIcon className="w-4 h-4" aria-hidden="true" />}
                {primaryAction.label}
              </button>
              <button
                onClick={resetCountdown}
                className="p-2.5 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-bg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-theme-accent"
                aria-label="Reiniciar pomodoro"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          {/* Caret pointing to the pill */}
          <div className="absolute -bottom-1 right-6 w-3 h-3 rotate-45 bg-theme-sidebar border-r border-b border-theme-border" />
        </div>
      )}

      {/* Pill — always-on timeout */}
      <button
        ref={pillRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
        aria-expanded={expanded}
        aria-label={`Pomodoro: ${MODE_LABEL[mode]} ${formatTime(minutes, seconds)}`}
        className={`group relative flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-full shadow-lg border transition-colors select-none touch-none cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-theme-accent ${
          isActive
            ? 'bg-theme-sidebar border-theme-accent/60 text-theme-text'
            : 'bg-theme-sidebar border-theme-border text-theme-text hover:border-theme-accent/50'
        }`}
      >
        {/* Elapsed ring around a soft dot; the dot pulses while running */}
        <span className="relative w-6 h-6 rounded-full block" aria-hidden="true">
          <span
            className="absolute inset-0 rounded-full block"
            style={{ background: ringBg }}
          />
          <span
            className={`absolute inset-[3px] rounded-full block ${
              isActive ? 'bg-theme-accent animate-pulse' : 'bg-theme-border'
            }`}
          />
        </span>
        <span className="font-mono font-semibold tabular-nums">{formatTime(minutes, seconds)}</span>
        <span className="text-xs opacity-80 hidden sm:inline">{MODE_LABEL[mode]}</span>

        {/* Gesture hint — appears only on hover, never a permanent footer */}
        {hovering && !expanded && (
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-theme-muted/80 bg-theme-sidebar border border-theme-border rounded-md px-1.5 py-0.5 pointer-events-none shadow-sm">
            espaço: iniciar/pausar
          </span>
        )}
      </button>
    </div>
  );
}

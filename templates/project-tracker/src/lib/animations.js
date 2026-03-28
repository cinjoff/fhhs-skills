import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

// ── Timing constants ──────────────────────────────────────────────────────────
export const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const STAGGER_MS = 50;
export const FLASH_DURATION_MS = 800;
export const COUNTER_DURATION_MS = 600;

// ── Phase color palette ───────────────────────────────────────────────────────
export const PHASE_COLORS = [
  '#34d399', '#60a5fa', '#fbbf24', '#a78bfa', '#f87171',
  '#2dd4bf', '#fb923c', '#e879f9', '#38bdf8', '#a3e635',
];

export function phaseColor(phaseId) {
  const num = parseInt(String(phaseId).replace(/\D/g, ''), 10) || 0;
  return PHASE_COLORS[num % PHASE_COLORS.length];
}

// ── AnimatedNumber component ──────────────────────────────────────────────────
// Uses useRef + rAF for Preact perf (not useState).
// Preact fires rAF same-tick as render — delay 1 frame with setTimeout.
export function AnimatedNumber({ value, duration = COUNTER_DURATION_MS, class: cls }) {
  const ref = useRef(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = prevValue.current;
    const end = value;
    prevValue.current = value;

    if (start === end) return;

    let frameId;

    // Delay 1 frame so DOM has committed before animating
    const timeout = setTimeout(() => {
      const startTime = performance.now();

      function update(now) {
        const t = Math.min((now - startTime) / duration, 1);
        // ease-out-expo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        el.textContent = Math.round(start + (end - start) * eased);
        if (t < 1) {
          frameId = requestAnimationFrame(update);
        }
      }

      frameId = requestAnimationFrame(update);
    }, 0);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameId);
    };
  }, [value, duration]);

  return h('span', { ref, class: `tabular-nums${cls ? ' ' + cls : ''}` }, value);
}

// ── Format helpers ────────────────────────────────────────────────────────────

/**
 * Format elapsed milliseconds as a human-readable string.
 * e.g. formatElapsed(0) → "0s", formatElapsed(45000) → "45s", formatElapsed(123000) → "2m 03s"
 */
export function formatElapsed(ms) {
  const totalSecs = Math.floor((ms || 0) / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

/**
 * Format a dollar amount.
 * e.g. formatCost(0) → "$0.00", formatCost(1.234) → "$1.23"
 */
export function formatCost(dollars) {
  return `$${(dollars || 0).toFixed(2)}`;
}

/**
 * Format an ISO timestamp as relative time.
 * e.g. relativeTime("2026-03-28T00:00:00Z") → "5s ago", "3m ago", "2h ago"
 */
export function relativeTime(isoString) {
  if (!isoString) return '';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ago`;
}

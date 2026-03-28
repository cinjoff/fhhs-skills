import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { formatDuration, formatCost } from '../lib/utils.js';

// ── Step rendering ──────────────────────────────────────────────────────────────

function StepToken({ name, status }) {
  let icon, color;
  if (status === 'done') {
    icon = '\u2713'; // ✓
    color = 'var(--color-status-done)';
  } else if (status === 'active') {
    icon = '\u25CF'; // ●
    color = 'var(--color-status-active)';
  } else {
    icon = '\u25CB'; // ○
    color = 'var(--color-status-pending)';
  }

  const isActive = status === 'active';

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      fontFamily: 'var(--font-family-sans)',
      color,
      ...(isActive ? { animation: 'auto-pulse 2s ease-in-out infinite' } : {}),
    }}>
      <span>{icon}</span>
      <span>{name}</span>
    </span>
  );
}

function StepSeparator() {
  return (
    <span style={{
      color: 'var(--color-text-tertiary)',
      fontSize: '12px',
      margin: '0 2px',
    }}>{'\u2192'}</span>
  );
}

// ── AutoPipeline ────────────────────────────────────────────────────────────────

export function AutoPipeline({ autoState }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!autoState?.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [autoState?.active]);

  if (!autoState?.active) return null;

  const {
    phase,
    phase_name,
    step,
    started_at,
    total_cost_estimate,
    elapsed_ms,
    step_history = [],
    last_log_line,
  } = autoState;

  // Compute live elapsed
  const liveElapsed = started_at
    ? now - new Date(started_at).getTime()
    : (elapsed_ms || 0);

  // Derive step statuses from step_history and current step
  // Display names → orchestrator step names mapping
  const knownSteps = ['plan', 'review', 'build', 'verify'];
  const stepAliases = {
    plan: ['plan', 'plan-work'],
    review: ['plan-review'],         // pre-build review only
    build: ['build'],
    verify: ['verify', 'review'],    // post-build 'review' step maps to verify display
  };
  const completedSet = new Set((step_history || []).map(h => h.step || h.name).filter(Boolean));

  function stepStatus(name) {
    const aliases = stepAliases[name] || [name];
    if (aliases.some(a => completedSet.has(a))) return 'done';
    if (step && aliases.some(a => step.toLowerCase() === a.toLowerCase())) return 'active';
    return 'pending';
  }

  return (
    <div style={{
      background: 'var(--color-bg-raised)',
      borderBottom: '1px solid var(--color-border-default)',
      padding: '12px 16px',
    }}>
      {/* Inject pulse keyframes */}
      <style>{`
        @keyframes auto-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Top row: label + duration/cost */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '11px',
          fontFamily: 'var(--font-family-sans)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          color: 'var(--color-status-active)',
        }}>AUTO RUNNING</span>
        <span style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '12px',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-text-secondary)',
        }}>
          {formatDuration(liveElapsed)}
          {total_cost_estimate != null && (
            <span> · {formatCost(total_cost_estimate)}</span>
          )}
        </span>
      </div>

      {/* Pipeline steps */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '6px',
        flexWrap: 'wrap',
      }}>
        {knownSteps.map((s, i) => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <StepToken name={s} status={stepStatus(s)} />
            {i < knownSteps.length - 1 && <StepSeparator />}
          </span>
        ))}
      </div>

      {/* Phase info */}
      {phase != null && (
        <div style={{
          fontSize: '13px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--color-text-primary)',
          marginBottom: '2px',
        }}>
          Phase {phase}{phase_name ? `: ${phase_name}` : ''}
        </div>
      )}

      {/* Current activity */}
      {last_log_line && (
        <div style={{
          fontSize: '12px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--color-text-tertiary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {last_log_line}
        </div>
      )}
    </div>
  );
}

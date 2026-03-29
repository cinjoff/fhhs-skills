import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { formatDuration, formatCost } from '../lib/utils.js';

// -- Step rendering ----------------------------------------------------------

function StepToken({ name, status }) {
  let icon, color;
  if (status === 'done') {
    icon = '\u2713'; // check
    color = 'var(--color-status-done)';
  } else if (status === 'active') {
    icon = '\u25CF'; // filled circle
    color = 'var(--color-status-active)';
  } else if (status === 'failed') {
    icon = '\u2717'; // x
    color = 'var(--color-status-error)';
  } else {
    icon = '\u25CB'; // empty circle
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

// -- Per-phase step derivation -----------------------------------------------

const STEP_NAMES = ['plan', 'review', 'build', 'verify'];

// Map phaseState string to per-step statuses
function deriveStepStatuses(phaseState, isCurrentPhase, currentStep) {
  // phaseState values: planning, reviewing, building, complete, failed, rescheduled-sequential, pending/undefined
  const statuses = { plan: 'pending', review: 'pending', build: 'pending', verify: 'pending' };

  if (!phaseState || phaseState === 'pending') {
    return statuses;
  }

  if (phaseState === 'complete') {
    return { plan: 'done', review: 'done', build: 'done', verify: 'done' };
  }

  // Progressive: each state implies prior steps are done
  const progression = ['planning', 'reviewing', 'building', 'verifying'];
  const stepMap = { planning: 'plan', reviewing: 'review', building: 'build', verifying: 'verify' };
  const idx = progression.indexOf(phaseState);

  if (idx >= 0) {
    // Mark all prior steps as done
    for (let i = 0; i < idx; i++) {
      statuses[stepMap[progression[i]]] = 'done';
    }
    // Current step is active
    statuses[stepMap[progression[idx]]] = 'active';
  }

  if (phaseState === 'failed') {
    // Find what step was active when failure occurred
    // Use currentStep if this is the current phase, otherwise mark build as failed (most common)
    const failedStep = isCurrentPhase ? mapCurrentStepToDisplay(currentStep) : 'build';
    // Mark everything before failedStep as done
    const failIdx = STEP_NAMES.indexOf(failedStep);
    for (let i = 0; i < failIdx; i++) {
      statuses[STEP_NAMES[i]] = 'done';
    }
    statuses[failedStep] = 'failed';
  }

  if (phaseState === 'rescheduled-sequential') {
    // Treat like pending but with plan marked as done (it was planned)
    statuses.plan = 'done';
  }

  return statuses;
}

// Map orchestrator step name to display step name
function mapCurrentStepToDisplay(step) {
  if (!step) return 'plan';
  const s = step.toLowerCase();
  if (s === 'plan' || s === 'plan-work') return 'plan';
  if (s === 'plan-review') return 'review';
  if (s === 'build') return 'build';
  if (s === 'verify' || s === 'review') return 'verify';
  return 'plan';
}

// -- PhaseStepRow ------------------------------------------------------------

function PhaseStepRow({ phaseNum, phaseName, phaseState, isCurrentPhase, currentStep }) {
  const stepStatuses = deriveStepStatuses(phaseState, isCurrentPhase, currentStep);
  const isDone = phaseState === 'complete';
  const isFailed = phaseState === 'failed';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '32px',
      padding: '0 4px',
      opacity: isDone ? 0.65 : 1,
      ...(isCurrentPhase && !isDone && !isFailed
        ? { animation: 'auto-pulse 2s ease-in-out infinite' }
        : {}),
    }}>
      {/* Phase label */}
      <span style={{
        fontSize: '12px',
        fontFamily: 'var(--font-family-sans)',
        color: isDone
          ? 'var(--color-status-done)'
          : isFailed
            ? 'var(--color-status-error)'
            : isCurrentPhase
              ? 'var(--color-text-primary)'
              : 'var(--color-text-secondary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '140px',
        flexShrink: 0,
      }}>
        {isDone && '\u2713 '}{isFailed && '\u2717 '}
        {phaseNum}{phaseName ? `. ${phaseName}` : ''}
      </span>

      {/* Step tokens */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        flexShrink: 0,
      }}>
        {STEP_NAMES.map((s, i) => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <StepToken name={s} status={stepStatuses[s]} />
            {i < STEP_NAMES.length - 1 && <StepSeparator />}
          </span>
        ))}
      </div>
    </div>
  );
}

// -- LogTail -----------------------------------------------------------------

function LogTail({ logBuffer, lastLogLine }) {
  const [collapsed, setCollapsed] = useState(true);
  const scrollRef = useRef(null);

  const entries = Array.isArray(logBuffer) && logBuffer.length > 0
    ? logBuffer
    : lastLogLine
      ? [{ ts: null, msg: lastLogLine }]
      : [];

  // Auto-scroll on new entries
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, collapsed]);

  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: '6px' }}>
      {/* Toggle header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-text-tertiary)',
          userSelect: 'none',
          marginBottom: collapsed ? 0 : '4px',
        }}
      >
        {collapsed ? '\u25B8' : '\u25BE'} Log ({entries.length})
      </div>

      {/* Log entries */}
      {!collapsed && (
        <div
          ref={scrollRef}
          style={{
            maxHeight: '100px',
            overflowY: 'auto',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '11px',
            lineHeight: '16px',
            background: 'var(--color-bg-raised)',
            borderRadius: '4px',
            padding: '4px 6px',
            border: '1px solid var(--color-border-default)',
          }}
        >
          {entries.map((entry, i) => (
            <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {entry.ts && (
                <span style={{ color: 'var(--color-text-tertiary)', marginRight: '6px' }}>
                  {formatLogTimestamp(entry.ts)}
                </span>
              )}
              <span style={{ color: 'var(--color-text-secondary)' }}>{entry.msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatLogTimestamp(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

// -- AutoPipeline (main) -----------------------------------------------------

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
    phases_total,
    phases_completed = 0,
    phases_failed = 0,
    phase_states = {},
    current_wave,
    concurrency = {},
    step_history = [],
    log_buffer,
    last_log_line,
    build_order = [],
  } = autoState;

  // Compute live elapsed
  const liveElapsed = started_at
    ? now - new Date(started_at).getTime()
    : (elapsed_ms || 0);

  // Derive phases in scope: from build_order, step_history, or phase_states
  const phaseSet = new Set();
  if (build_order.length > 0) {
    build_order.forEach(p => phaseSet.add(p));
  }
  Object.keys(phase_states).forEach(p => phaseSet.add(Number(p)));
  (step_history || []).forEach(h => { if (h.phase != null) phaseSet.add(h.phase); });
  if (phase != null) phaseSet.add(phase);

  const scopePhases = Array.from(phaseSet).sort((a, b) => a - b);
  const hasPerPhaseData = scopePhases.length > 0 && Object.keys(phase_states).length > 0;

  // Wave label
  const waveLabel = current_wave
    ? current_wave.charAt(0).toUpperCase() + current_wave.slice(1) + ' Wave'
    : null;

  const isParallel = (concurrency.active > 1) || (concurrency.max > 1);

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

      {/* Header row: label + phase progress + elapsed + cost */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontFamily: 'var(--font-family-sans)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-status-active)',
          }}>AUTO RUNNING</span>

          {phases_total > 0 && (
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-text-secondary)',
              background: 'var(--color-border-default)',
              borderRadius: '3px',
              padding: '1px 5px',
            }}>
              {phases_completed}/{phases_total} phases
            </span>
          )}

          {isParallel && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-status-active)',
              border: '1px solid var(--color-status-active)',
              borderRadius: '3px',
              padding: '0 4px',
              lineHeight: '16px',
            }}>parallel</span>
          )}
        </div>

        <span style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '12px',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--color-text-secondary)',
        }}>
          {formatDuration(liveElapsed)}
          {total_cost_estimate != null && (
            <span> \u00B7 {formatCost(total_cost_estimate)}</span>
          )}
        </span>
      </div>

      {/* Wave label */}
      {waveLabel && (
        <div style={{
          fontSize: '11px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          marginBottom: '4px',
        }}>
          {waveLabel}
        </div>
      )}

      {/* Per-phase rows or fallback single pipeline */}
      {hasPerPhaseData ? (
        <div style={{ marginBottom: '4px' }}>
          {scopePhases.map(p => {
            const pState = phase_states[p] || phase_states[String(p)] || 'pending';
            const isCurrent = p === phase;
            // Try to find phase name from step_history or fallback
            const histEntry = (step_history || []).find(h => h.phase === p);
            const pName = isCurrent ? phase_name : (histEntry ? histEntry.phase_name : null);
            return (
              <PhaseStepRow
                key={p}
                phaseNum={p}
                phaseName={pName || ''}
                phaseState={pState}
                isCurrentPhase={isCurrent}
                currentStep={step}
              />
            );
          })}
        </div>
      ) : (
        <div>
          {/* Fallback: single pipeline for current phase (backward compat) */}
          <FallbackPipeline phase={phase} phaseName={phase_name} step={step} stepHistory={step_history} />
        </div>
      )}

      {/* Log tail */}
      <LogTail logBuffer={log_buffer} lastLogLine={last_log_line} />
    </div>
  );
}

// -- Fallback single pipeline (backward compat) ------------------------------

function FallbackPipeline({ phase, phaseName, step, stepHistory }) {
  const stepAliases = {
    plan: ['plan', 'plan-work'],
    review: ['plan-review'],
    build: ['build'],
    verify: ['verify', 'review'],
  };
  const completedSet = new Set((stepHistory || []).map(h => h.step || h.name).filter(Boolean));

  function stepStatus(name) {
    const aliases = stepAliases[name] || [name];
    if (aliases.some(a => completedSet.has(a))) return 'done';
    if (step && aliases.some(a => step.toLowerCase() === a.toLowerCase())) return 'active';
    return 'pending';
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginBottom: '6px',
        flexWrap: 'wrap',
      }}>
        {STEP_NAMES.map((s, i) => (
          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <StepToken name={s} status={stepStatus(s)} />
            {i < STEP_NAMES.length - 1 && <StepSeparator />}
          </span>
        ))}
      </div>
      {phase != null && (
        <div style={{
          fontSize: '13px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--color-text-primary)',
          marginBottom: '2px',
        }}>
          Phase {phase}{phaseName ? `: ${phaseName}` : ''}
        </div>
      )}
    </div>
  );
}

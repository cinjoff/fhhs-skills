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

// Active states that warrant showing activity badge
const ACTIVE_PHASE_STATES = new Set(['planning', 'reviewing', 'building', 'verifying']);

function PhaseStepRow({ phaseNum, phaseName, phaseState, isCurrentPhase, currentStep, activityInfo, phaseCost, now }) {
  const stepStatuses = deriveStepStatuses(phaseState, isCurrentPhase, currentStep);
  const isDone = phaseState === 'complete';
  const isFailed = phaseState === 'failed';
  const showActivity = ACTIVE_PHASE_STATES.has(phaseState) && activityInfo;
  const showCost = phaseCost != null && phaseCost > 0.01;

  return (
    <div style={{
      padding: '2px 4px',
      opacity: isDone ? 0.65 : 1,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '28px',
        ...(isCurrentPhase && !isDone && !isFailed
          ? { animation: 'auto-pulse 2s ease-in-out infinite' }
          : {}),
      }}>
        {/* Phase label + optional cost badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, maxWidth: '160px' }}>
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
          }}>
            {isDone && '\u2713 '}{isFailed && '\u2717 '}
            {phaseNum}{phaseName ? `. ${phaseName}` : ''}
          </span>
          {showCost && (
            <span style={{
              fontSize: '10px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-border-default)',
              borderRadius: '3px',
              padding: '0 4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>{formatCost(phaseCost)}</span>
          )}
        </div>

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

      {/* Activity badge — shown below for active phases */}
      {showActivity && (
        <ActivityBadge activityInfo={activityInfo} now={now} />
      )}
    </div>
  );
}

// -- LogTail -----------------------------------------------------------------

const LOG_FILTERS = ['All', 'Sessions', 'Tools', 'Errors'];

function filterEntries(entries, filter) {
  if (filter === 'All') return entries;
  if (filter === 'Sessions') return entries.filter(e => e.type === 'session-start' || e.type === 'session-end' || e.type === 'session-killed');
  if (filter === 'Tools') return entries.filter(e => e.type === 'tool-call');
  if (filter === 'Errors') return entries.filter(e => e.type === 'session-killed' || e.level === 'error');
  return entries;
}

function formatLogEntry(entry) {
  const ts = entry.ts ? formatLogTimestamp(entry.ts) : '';
  const tsPrefix = ts ? `[${ts}] ` : '';
  const type = entry.type;

  if (type === 'tool-call') {
    const label = `${tsPrefix}Phase ${entry.phase != null ? entry.phase : '?'} ${entry.step || ''}: ${entry.tool || entry.msg || ''} (#${entry.tool_count != null ? entry.tool_count : '?'})`;
    return { label, color: 'var(--color-text-tertiary)' };
  }
  if (type === 'session-start') {
    const label = `${tsPrefix}\u25B8 Phase ${entry.phase != null ? entry.phase : '?'} ${entry.step || ''} started`;
    return { label, color: 'var(--color-status-info, oklch(0.6 0.15 240))' };
  }
  if (type === 'session-end') {
    const elapsed = entry.elapsed_s != null ? entry.elapsed_s : (entry.elapsed_ms != null ? Math.round(entry.elapsed_ms / 1000) : '?');
    const label = `${tsPrefix}\u2713 Phase ${entry.phase != null ? entry.phase : '?'} ${entry.step || ''} done (${elapsed}s, ${entry.tool_count != null ? entry.tool_count : '?'} tools)`;
    return { label, color: 'var(--color-status-done)' };
  }
  if (type === 'session-killed') {
    const label = `${tsPrefix}\u2717 Phase ${entry.phase != null ? entry.phase : '?'} ${entry.step || ''} killed (${entry.reason || 'unknown'}, last: ${entry.last_tool || 'none'})`;
    return { label, color: 'var(--color-status-error)' };
  }
  // default / type === 'log'
  const label = `${tsPrefix}${entry.msg || JSON.stringify(entry)}`;
  return { label, color: 'var(--color-text-secondary)' };
}

function LogTail({ logBuffer, lastLogLine, refreshTick }) {
  const [collapsed, setCollapsed] = useState(false);
  const [apiEntries, setApiEntries] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const latestTsRef = useRef(null);
  const scrollRef = useRef(null);

  // Fetch /api/logs on mount and on each SSE refresh
  useEffect(() => {
    let cancelled = false;

    const fetchLogs = () => {
      const url = latestTsRef.current
        ? `/api/logs?limit=200&since=${encodeURIComponent(latestTsRef.current)}`
        : '/api/logs?limit=200';

      fetch(url)
        .then(r => r.ok ? r.text() : Promise.reject(r.status))
        .then(text => {
          if (cancelled) return;
          const lines = text.trim().split('\n').filter(Boolean);
          const parsed = [];
          for (const line of lines) {
            try { parsed.push(JSON.parse(line)); } catch (_) {}
          }
          if (parsed.length > 0) {
            setApiEntries(prev => {
              // Merge: if incremental, append; if initial, replace
              const base = latestTsRef.current ? (prev || []) : [];
              const merged = [...base, ...parsed];
              // Update latest ts for next incremental fetch
              const last = merged[merged.length - 1];
              if (last && last.ts) latestTsRef.current = last.ts;
              return merged;
            });
          }
        })
        .catch(() => {});
    };

    fetchLogs();
    return () => { cancelled = true; };
  }, [refreshTick]);

  // Fallback entries from log_buffer / last_log_line
  const fallbackEntries = Array.isArray(logBuffer) && logBuffer.length > 0
    ? logBuffer
    : lastLogLine
      ? [{ ts: null, msg: lastLogLine }]
      : [];

  const allEntries = (apiEntries && apiEntries.length > 0) ? apiEntries : fallbackEntries;
  const visibleEntries = filterEntries(allEntries, activeFilter);

  // Auto-scroll on new entries
  useEffect(() => {
    if (!collapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleEntries.length, collapsed]);

  if (allEntries.length === 0) return null;

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
        {collapsed ? '\u25B8' : '\u25BE'} Log ({allEntries.length})
      </div>

      {/* Log entries */}
      {!collapsed && (
        <div>
          {/* Filter row */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '4px',
          }}>
            {LOG_FILTERS.map(f => (
              <button
                key={f}
                onClick={(e) => { e.stopPropagation(); setActiveFilter(f); }}
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-family-mono)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: activeFilter === f
                    ? '1px solid var(--color-text-secondary)'
                    : '1px solid var(--color-border-default)',
                  background: activeFilter === f
                    ? 'var(--color-border-default)'
                    : 'transparent',
                  color: activeFilter === f
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-tertiary)',
                }}
              >{f}</button>
            ))}
          </div>

          <div
            ref={scrollRef}
            style={{
              maxHeight: '400px',
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
            {visibleEntries.map((entry, i) => {
              const { label, color } = formatLogEntry(entry);
              return (
                <div key={i} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color }}>
                  {label}
                </div>
              );
            })}
          </div>
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

// -- FreshnessIndicator -------------------------------------------------------

// Shared color thresholds for freshness — used by FreshnessIndicator and ActivityBadge
function getFreshnessColor(silenceMs) {
  if (silenceMs < 60000) return 'var(--color-status-done)';      // <1m: green
  if (silenceMs < 180000) return 'var(--color-status-warning)';  // <3m: yellow
  if (silenceMs < 480000) return 'oklch(0.7 0.15 70)';           // <8m: amber
  return 'var(--color-status-error)';                             // >8m: red
}

function FreshnessIndicator({ lastActivityAt, now }) {
  if (!lastActivityAt) return null;

  const silenceMs = now - new Date(lastActivityAt).getTime();
  if (isNaN(silenceMs) || silenceMs < 0) return null;

  const color = getFreshnessColor(silenceMs);
  let label;
  if (silenceMs < 60000) {
    label = Math.round(silenceMs / 1000) + 's ago';
  } else if (silenceMs < 180000) {
    label = Math.round(silenceMs / 60000) + 'm ago';
  } else {
    label = Math.round(silenceMs / 60000) + 'm ago (silent)';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: 'var(--font-family-mono)',
      fontSize: '11px',
      color,
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

// -- ActivityBadge ------------------------------------------------------------

// Shows live activity for an active session (from session_activity in auto-state)
// activityInfo: { last_tool, last_tool_at, tool_count, started_at } | null
function ActivityBadge({ activityInfo, now }) {
  if (!activityInfo) return null;
  const { last_tool, last_tool_at, tool_count, started_at } = activityInfo;

  const silenceMs = last_tool_at ? now - new Date(last_tool_at).getTime() : null;
  const elapsedMs = started_at ? now - new Date(started_at).getTime() : null;

  const color = silenceMs != null && !isNaN(silenceMs) && silenceMs >= 0
    ? getFreshnessColor(silenceMs)
    : 'var(--color-text-tertiary)';

  let sinceLabel = '';
  if (silenceMs != null && !isNaN(silenceMs) && silenceMs >= 0) {
    sinceLabel = silenceMs < 60000
      ? Math.round(silenceMs / 1000) + 's ago'
      : Math.round(silenceMs / 60000) + 'm ago';
  }

  let elapsedLabel = '';
  if (elapsedMs != null && !isNaN(elapsedMs) && elapsedMs >= 0) {
    elapsedLabel = elapsedMs < 60000
      ? Math.round(elapsedMs / 1000) + 's elapsed'
      : Math.round(elapsedMs / 60000) + 'm elapsed';
  }

  const parts = [];
  if (last_tool) parts.push(last_tool);
  if (sinceLabel) parts.push(sinceLabel);
  if (tool_count != null) parts.push(tool_count + ' tools');
  if (elapsedLabel) parts.push(elapsedLabel);

  if (parts.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '10px',
      fontFamily: 'var(--font-family-mono)',
      color,
      paddingLeft: '4px',
      marginTop: '1px',
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        animation: 'auto-pulse 2s ease-in-out infinite',
      }} />
      {parts.join(' | ')}
    </div>
  );
}

// -- ErrorPanel ---------------------------------------------------------------

const COST_PER_INPUT_TOKEN = 0.003 / 1000;
const COST_PER_OUTPUT_TOKEN = 0.015 / 1000;

function formatErrorTimestamp(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function ErrorPanel({ errors }) {
  // Collapsed by default only if >5 errors; expand for <=5
  const [collapsed, setCollapsed] = useState(() => !errors || errors.length > 5);

  if (!errors || errors.length === 0) return null;

  return (
    <div style={{
      borderLeft: '3px solid var(--color-status-error)',
      paddingLeft: '8px',
      marginBottom: '8px',
    }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-status-error)',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{collapsed ? '\u25B8' : '\u25BE'}</span>
        <span>\u26A0 {errors.length} error{errors.length !== 1 ? 's' : ''}</span>
      </div>

      {!collapsed && (
        <div style={{ marginTop: '4px' }}>
          {errors.map((err, i) => {
            const isLast = i === errors.length - 1;
            const prefix = isLast ? '\u2514\u2500' : '\u251C\u2500';
            const tsLabel = formatErrorTimestamp(err.ts || err.timestamp);
            const parts = [];
            if (err.phase != null) parts.push(`Phase ${err.phase}`);
            if (err.step) parts.push(err.step);
            const location = parts.join(' ');
            const errType = err.error_type || err.type || 'error';
            const attempts = err.attempts != null ? ` (${err.attempts} attempt${err.attempts !== 1 ? 's' : ''})` : '';
            return (
              <div key={i} style={{
                fontSize: '10px',
                fontFamily: 'var(--font-family-mono)',
                color: 'var(--color-status-error)',
                lineHeight: '15px',
              }}>
                {prefix} {location}{location ? ': ' : ''}{errType}{attempts}{tsLabel ? ' \u2014 ' + tsLabel : ''}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -- KillButton ---------------------------------------------------------------

function KillButton({ silenceMs }) {
  const [sent, setSent] = useState(false);

  if (!silenceMs || silenceMs < 180000) return null; // only show after 3min silence

  const handleKill = () => {
    fetch('/api/kill', { method: 'POST' })
      .then(() => setSent(true))
      .catch(() => setSent(true));
  };

  if (sent) {
    return (
      <span style={{
        fontSize: '11px',
        fontFamily: 'var(--font-family-mono)',
        color: 'var(--color-status-warning)',
      }}>Kill signal sent</span>
    );
  }

  return (
    <button
      onClick={handleKill}
      style={{
        fontSize: '11px',
        fontFamily: 'var(--font-family-mono)',
        color: 'var(--color-status-error)',
        background: 'transparent',
        border: '1px solid var(--color-status-error)',
        borderRadius: '3px',
        padding: '1px 6px',
        cursor: 'pointer',
        lineHeight: '16px',
      }}
    >Kill</button>
  );
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
    last_activity_at,
    build_order = [],
    session_activity = {},
    errors = [],
    phase_costs: rawPhaseCosts,
  } = autoState;

  // Compute per-phase costs: use phase_costs from state if available, else calculate from step_history
  const phaseCosts = (() => {
    if (rawPhaseCosts && typeof rawPhaseCosts === 'object') return rawPhaseCosts;
    const acc = {};
    for (const h of (step_history || [])) {
      if (h.phase == null || !h.metrics) continue;
      const { tokens_in = 0, tokens_out = 0 } = h.metrics;
      const cost = tokens_in * COST_PER_INPUT_TOKEN + tokens_out * COST_PER_OUTPUT_TOKEN;
      acc[h.phase] = (acc[h.phase] || 0) + cost;
    }
    return acc;
  })();

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FreshnessIndicator lastActivityAt={last_activity_at} now={now} />
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
          <KillButton silenceMs={last_activity_at ? now - new Date(last_activity_at).getTime() : 0} />
        </div>
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
            // session_activity keyed by phase number (string or number)
            const activityInfo = (session_activity && (session_activity[p] || session_activity[String(p)])) || null;
            const phaseCost = phaseCosts[p] != null ? phaseCosts[p] : (phaseCosts[String(p)] != null ? phaseCosts[String(p)] : null);
            return (
              <PhaseStepRow
                key={p}
                phaseNum={p}
                phaseName={pName || ''}
                phaseState={pState}
                isCurrentPhase={isCurrent}
                currentStep={step}
                activityInfo={activityInfo}
                phaseCost={phaseCost}
                now={now}
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

      {/* Error panel — shown above log if errors present */}
      <ErrorPanel errors={errors} />

      {/* Log tail */}
      <LogTail logBuffer={log_buffer} lastLogLine={last_log_line} refreshTick={last_activity_at} />
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

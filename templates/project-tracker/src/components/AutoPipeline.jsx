import { h } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { AnimatedNumber, phaseColor, formatElapsed, formatCost, EASE_EXPO } from '../lib/animations.js';

// ── Wave step names ────────────────────────────────────────────────────────────
const WAVE_STEPS = ['planning', 'review', 'build'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function sumHistory(entries) {
  let cost = 0;
  let elapsedMs = 0;
  for (const e of entries) {
    cost += e.cost_usd || 0;
    elapsedMs += e.elapsed_ms || 0;
  }
  return { cost, elapsedMs };
}

function liveElapsed(startedAt, now) {
  if (!startedAt) return 0;
  return now - new Date(startedAt).getTime();
}

// ── PhasePill ──────────────────────────────────────────────────────────────────

const PhasePill = memo(function PhasePill({ phaseId, phaseName, status, stepHistory, index, now }) {
  const [hovered, setHovered] = useState(false);
  const color = phaseColor(phaseId);

  const ownHistory = useMemo(
    () => (stepHistory || []).filter(e => String(e.phase_id) === String(phaseId)),
    [stepHistory, phaseId]
  );

  // Per-step breakdown for tooltip
  const byStep = useMemo(() => {
    const map = {};
    for (const e of ownHistory) {
      const step = e.step || 'unknown';
      if (!map[step]) map[step] = { elapsedMs: 0, cost: 0 };
      map[step].elapsedMs += e.elapsed_ms || 0;
      map[step].cost += e.cost_usd || 0;
    }
    return map;
  }, [ownHistory]);

  const { cost: totalCost, elapsedMs: totalElapsed } = sumHistory(ownHistory);

  // Active: live elapsed from started_at
  const activeEntry = status === 'active'
    ? (stepHistory || []).find(e => String(e.phase_id) === String(phaseId) && !e.elapsed_ms && e.started_at)
    : null;
  const liveMs = activeEntry ? liveElapsed(activeEntry.started_at, now) : 0;

  // Visual state styles
  let borderStyle = {};
  let bgStyle = {};
  let iconChar = '·';
  let textOpacity = '';
  let extraClass = '';

  if (status === 'done') {
    bgStyle = { backgroundColor: color + '1a' }; // 10% opacity
    borderStyle = { borderColor: color + '44' };
    iconChar = '✓';
    textOpacity = 'opacity-60';
  } else if (status === 'active') {
    borderStyle = { borderColor: color };
    iconChar = '⟳';
    extraClass = 'progress-pulse';
  } else if (status === 'failed') {
    bgStyle = { backgroundColor: 'oklch(0.5 0.25 25 / 0.1)' };
    borderStyle = { borderColor: 'var(--color-fire)' };
    iconChar = '✗';
  } else if (status === 'rescheduled') {
    borderStyle = { borderColor: 'var(--color-amber)', borderStyle: 'dashed' };
    iconChar = '↻';
  } else if (status === 'skipped') {
    borderStyle = { borderColor: 'var(--color-dim)' };
    iconChar = '·';
    textOpacity = 'opacity-40 line-through';
  } else {
    // pending
    borderStyle = { borderColor: 'var(--color-dim)' };
  }

  const showTooltip = hovered || status === 'failed';
  const hasBreakdown = Object.keys(byStep).length > 0;

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        class={`stagger-item inline-flex flex-col items-center min-w-[56px] px-2 py-1 rounded border text-[0.65rem] cursor-default ${textOpacity} ${extraClass}`}
        style={{ ...bgStyle, ...borderStyle, '--index': index, animationDelay: `calc(${index} * ${STAGGER_MS}ms)` }}
      >
        <span class="font-bold tabular-nums" style={{ color: status === 'active' ? color : undefined }}>
          {iconChar} P{phaseId}
        </span>
        <span class="text-muted truncate max-w-[52px]" title={phaseName}>
          {phaseName && phaseName.length > 7 ? phaseName.slice(0, 6) + '…' : (phaseName || '')}
        </span>
        {status === 'active' && (
          <span class="text-muted tabular-nums" style={{ color }}>
            {formatElapsed(liveMs)}
          </span>
        )}
      </div>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(4px)',
            borderRadius: '3px',
            padding: '8px 10px',
            minWidth: '200px',
            pointerEvents: 'none',
            fontFamily: 'var(--font-family-mono)',
            fontSize: '0.65rem',
            lineHeight: '1.5',
            whiteSpace: 'pre',
          }}
        >
          <div style={{ color: color, fontWeight: 'bold', marginBottom: '3px' }}>
            Phase {phaseId}{phaseName ? `: ${phaseName}` : ''}
          </div>
          <div style={{ color: 'var(--color-dim)', marginBottom: '4px' }}>{'─'.repeat(22)}</div>
          {hasBreakdown ? (
            Object.entries(byStep).map(([step, { elapsedMs, cost }]) => (
              <div key={step} class="tabular-nums" style={{ color: 'var(--color-text)' }}>
                {step.padEnd(10)} {formatElapsed(elapsedMs).padStart(8)}  {formatCost(cost)}
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--color-muted)' }}>no data</div>
          )}
          {hasBreakdown && (
            <>
              <div style={{ color: 'var(--color-dim)', margin: '4px 0' }}>{'─'.repeat(22)}</div>
              <div class="tabular-nums" style={{ color: 'var(--color-bright)', fontWeight: 'bold' }}>
                {'total     '} {formatElapsed(totalElapsed).padStart(8)}  {formatCost(totalCost)}
              </div>
            </>
          )}
          {status === 'rescheduled' && (
            <div style={{ color: 'var(--color-amber)', marginTop: '4px' }}>
              Rescheduled: file overlap with failed phase
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ── BuildOrderPreview ──────────────────────────────────────────────────────────

function BuildOrderPreview({ phases }) {
  if (!phases || phases.length === 0) return null;

  // Group phases: each element is either a single phase or an array of parallel phases
  // Simple heuristic: treat all as a flat chain for now
  const segments = phases.map(p => ({ id: p.id, name: p.name }));

  return (
    <div class="text-xs text-muted font-mono mt-1 flex flex-wrap items-center gap-1">
      {segments.map((p, i) => (
        <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span class="font-bold" style={{ color: phaseColor(p.id) }}>P{p.id}</span>
          {i < segments.length - 1 && (
            <span style={{ color: 'var(--color-dim)' }}>→</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ── ConcurrencyIndicator ───────────────────────────────────────────────────────

function ConcurrencyIndicator({ active, max }) {
  const pct = max > 0 ? (active / max) * 100 : 0;
  const atCapacity = active >= max && max > 0;
  const hasActive = active > 0;

  let barColor = 'var(--color-dim)';
  if (atCapacity) barColor = 'var(--color-amber)';
  else if (hasActive) barColor = 'var(--color-green)';

  let labelColor = 'var(--color-muted)';
  if (atCapacity) labelColor = 'var(--color-amber)';
  else if (hasActive) labelColor = 'var(--color-green)';

  return (
    <div class="flex items-center gap-2 text-xs">
      <span style={{ color: labelColor, fontVariantNumeric: 'tabular-nums' }}>
        Sessions: <AnimatedNumber value={active} /> / {max}
      </span>
      <div style={{ width: '36px', height: '3px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: barColor,
          borderRadius: '2px',
          transition: `width 0.4s ${EASE_EXPO}`,
        }} />
      </div>
    </div>
  );
}

// ── WaveLane ───────────────────────────────────────────────────────────────────

function WaveLane({ name, phases, isActive, isComplete, stepHistory, now, isBuildWave }) {
  const waveHistory = useMemo(
    () => (stepHistory || []).filter(e => (e.step || '').toLowerCase() === name.toLowerCase()),
    [stepHistory, name]
  );

  const { cost, elapsedMs } = useMemo(() => sumHistory(waveHistory), [waveHistory]);

  // Live elapsed for active wave: find earliest started_at in active steps
  const activeStartEntry = isActive
    ? waveHistory.find(e => e.started_at && !e.elapsed_ms)
    : null;
  const displayElapsed = isActive && activeStartEntry
    ? liveElapsed(activeStartEntry.started_at, now)
    : elapsedMs;

  const phaseCount = phases ? phases.length : 0;

  // Container styles
  let containerStyle = {
    borderRadius: '3px',
    padding: '8px 10px',
    marginBottom: '6px',
    border: '1px solid',
  };

  let statusIcon = '·';

  if (isActive) {
    containerStyle.borderLeft = '2px solid var(--accent-success, var(--color-green))';
    containerStyle.borderColor = 'var(--color-border)';
    containerStyle.background = 'var(--color-surface)';
    statusIcon = '⟳';
  } else if (isComplete) {
    containerStyle.borderColor = 'var(--color-border)';
    containerStyle.opacity = '0.7';
    statusIcon = '✓';
  } else {
    // pending
    containerStyle.borderColor = 'var(--color-dim)';
    containerStyle.borderStyle = 'dashed';
    containerStyle.opacity = '0.4';
  }

  const hasStats = cost > 0 || displayElapsed > 0;

  return (
    <div style={containerStyle}>
      {/* Header row */}
      <div class="flex items-center justify-between gap-2 mb-1">
        <div class="flex items-center gap-2">
          <span class="text-xs tracking-wide uppercase" style={{ color: 'var(--color-text-tertiary, var(--color-muted))' }}>
            {name}
          </span>
          <span class="text-xs" style={{ color: isActive ? 'var(--color-green)' : isComplete ? 'var(--color-subtle)' : 'var(--color-dim)' }}>
            {statusIcon}
          </span>
        </div>
        {hasStats && (
          <div class="flex items-center gap-2 text-xs tabular-nums" style={{ color: 'var(--color-muted)' }}>
            {isComplete && <span style={{ color: 'var(--color-subtle)' }}>{name} ✓</span>}
            <span class="tabular-nums">
              {formatElapsed(displayElapsed)}
            </span>
            <span>·</span>
            <span class="tabular-nums">
              {formatCost(cost)}
            </span>
            <span>·</span>
            <span>{phaseCount} {phaseCount === 1 ? 'phase' : 'phases'}</span>
          </div>
        )}
      </div>

      {/* Phase pills */}
      {phases && phases.length > 0 && (
        <div class="flex flex-wrap gap-1 mt-1">
          {phases.map((p, i) => (
            <PhasePill
              key={p.id}
              phaseId={p.id}
              phaseName={p.name}
              status={p.status}
              stepHistory={stepHistory}
              index={i}
              now={now}
            />
          ))}
        </div>
      )}

      {/* Build order preview inside build wave */}
      {isBuildWave && phases && phases.length > 0 && (
        <BuildOrderPreview phases={phases} />
      )}
    </div>
  );
}

// ── SkeletonShimmer ────────────────────────────────────────────────────────────

function SkeletonShimmer() {
  return (
    <div class="mb-4">
      {[0, 1, 2].map(i => (
        <div key={i} style={{ marginBottom: '6px', borderRadius: '3px', padding: '8px 10px', border: '1px dashed var(--color-dim)', opacity: 1 - i * 0.15 }}>
          <div class="skeleton" style={{ height: '10px', width: '60px', marginBottom: '8px', borderRadius: '3px' }} />
          <div class="flex gap-1 flex-wrap">
            {Array.from({ length: 4 - i }).map((_, j) => (
              <div key={j} class="skeleton" style={{ height: '44px', width: '56px', borderRadius: '3px' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── SequentialFallback ─────────────────────────────────────────────────────────

function SequentialFallback({ phases, phasesCompleted, phasesTotal }) {
  const items = phases || [];
  return (
    <div>
      <div class="flex flex-wrap items-center gap-1 text-xs mb-2">
        {items.map((p, i) => {
          const color = phaseColor(p.id);
          let icon = '·';
          let col = 'var(--color-dim)';
          if (p.status === 'done') { icon = '✓'; col = 'var(--color-subtle)'; }
          else if (p.status === 'active') { icon = '⟳'; col = color; }
          else if (p.status === 'failed') { icon = '✗'; col = 'var(--color-fire)'; }
          return (
            <span key={p.id} class="flex items-center gap-1">
              <span style={{ color: col }}>{icon}</span>
              <span style={{ color: col, fontVariantNumeric: 'tabular-nums' }}>{p.name || `P${p.id}`}</span>
              {i < items.length - 1 && <span style={{ color: 'var(--color-dim)' }}>→</span>}
            </span>
          );
        })}
      </div>
      <div class="text-xs" style={{ color: 'var(--color-muted)' }}>
        Phase {phasesCompleted} of {phasesTotal}
        <span style={{ color: 'var(--color-dim)', margin: '0 6px' }}>|</span>
        <AnimatedNumber value={phasesTotal > 0 ? Math.round((phasesCompleted / phasesTotal) * 100) : 0} />%
      </div>
    </div>
  );
}

// ── AutoPipeline ───────────────────────────────────────────────────────────────

export function AutoPipeline({ autoState }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Empty / loading state
  if (!autoState) {
    return (
      <div class="bg-surface border border-border rounded-[3px] p-4 mb-4">
        <SkeletonShimmer />
      </div>
    );
  }

  const {
    phase_states = {},
    phases_completed = 0,
    phases_total = 0,
    concurrency = {},
    step_history = [],
    cost_total_usd = 0,
  } = autoState;

  // Empty phase_states → skeleton
  const phaseIds = Object.keys(phase_states);
  if (phaseIds.length === 0) {
    return (
      <div class="bg-surface border border-border rounded-[3px] p-4 mb-4">
        <SkeletonShimmer />
      </div>
    );
  }

  // Build phase list with status
  const phaseList = phaseIds.map(id => ({
    id,
    name: phase_states[id].name || '',
    status: phase_states[id].status || 'pending',
    wave: phase_states[id].wave || 'build',
  }));

  // Sequential fallback: concurrency.max === 1
  const maxConcurrency = concurrency.max || 1;
  if (maxConcurrency === 1) {
    const progressPct = phases_total > 0 ? Math.round((phases_completed / phases_total) * 100) : 0;
    return (
      <div class="bg-surface border border-border rounded-[3px] p-4 mb-4">
        <SequentialFallback
          phases={phaseList}
          phasesCompleted={phases_completed}
          phasesTotal={phases_total}
        />
        <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '9999px', marginTop: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'var(--color-green)',
            borderRadius: '9999px',
            transition: `width 0.5s ${EASE_EXPO}`,
          }} />
        </div>
      </div>
    );
  }

  // Group phases by wave
  const waveMap = {};
  for (const wave of WAVE_STEPS) waveMap[wave] = [];
  for (const p of phaseList) {
    const w = (p.wave || 'build').toLowerCase();
    if (!waveMap[w]) waveMap[w] = [];
    waveMap[w].push(p);
  }

  // Determine which wave is active/complete
  function waveStatus(waveName) {
    const wPhases = waveMap[waveName] || [];
    if (wPhases.length === 0) return 'empty';
    if (wPhases.every(p => p.status === 'done' || p.status === 'skipped')) return 'complete';
    if (wPhases.some(p => p.status === 'active')) return 'active';
    if (wPhases.some(p => p.status === 'done')) return 'active'; // partially done = in progress
    return 'pending';
  }

  const activeConcurrency = concurrency.active || 0;
  const progressPct = phases_total > 0 ? Math.round((phases_completed / phases_total) * 100) : 0;

  return (
    <div class="bg-surface border border-border rounded-[3px] p-4 mb-4">
      {/* Top bar: concurrency indicator */}
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs" style={{ color: 'var(--color-dim)' }}>pipeline</span>
        <ConcurrencyIndicator active={activeConcurrency} max={maxConcurrency} />
      </div>

      {/* Wave lanes */}
      {WAVE_STEPS.map(wave => {
        const phases = waveMap[wave] || [];
        if (phases.length === 0) return null;
        const ws = waveStatus(wave);
        return (
          <WaveLane
            key={wave}
            name={wave}
            phases={phases}
            isActive={ws === 'active'}
            isComplete={ws === 'complete'}
            stepHistory={step_history}
            now={now}
            isBuildWave={wave === 'build'}
          />
        );
      })}

      {/* Overall progress bar */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ height: '3px', background: 'var(--color-border)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            width: `${progressPct}%`,
            height: '100%',
            background: 'var(--color-green)',
            borderRadius: '9999px',
            transition: `width 0.5s ${EASE_EXPO}`,
          }} />
        </div>
        <div class="flex items-center justify-between mt-1">
          <span class="text-xs tabular-nums" style={{ color: 'var(--color-muted)' }}>
            <AnimatedNumber value={phases_completed} /> / {phases_total} phases complete
            {'  '}
            <AnimatedNumber value={progressPct} />%
          </span>
          <span class="text-xs tabular-nums" style={{ color: 'var(--color-muted)' }}>
            {formatCost(cost_total_usd)}
          </span>
        </div>
      </div>
    </div>
  );
}

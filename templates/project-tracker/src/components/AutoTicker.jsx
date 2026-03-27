/**
 * AutoTicker — compact strip showing all running auto-mode jobs across all projects.
 *
 * Each job renders as a single line:
 *   ● {repoName}  Phase {N} Step {M}  {duration}  ${cost}
 *
 * Props:
 *   autoJobs      — array of { projectPath, projectName, repoName, autoState }
 *   onSelectProject — called with projectPath when a job is clicked
 */

import { useState, useEffect } from 'preact/hooks';

function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${s}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  if (h === 0) return `${m}m ${rem}s`;
  return `${h}h ${remM}m`;
}

function formatCost(cost) {
  if (!cost && cost !== 0) return null;
  return `$${Number(cost).toFixed(2)}`;
}

export function AutoTicker({ autoJobs, onSelectProject }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!autoJobs || autoJobs.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [autoJobs && autoJobs.length]);

  if (!autoJobs || autoJobs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end' }}>
      {autoJobs.map((job) => {
        const s = job.autoState || {};
        const phase = s.current_phase || '';
        const step = s.current_step || '';
        const phasesCompleted = s.phases_completed ?? 0;
        const stepStartedAt = s.step_started_at || null;
        const totalCost = s.total_cost ?? s.cost ?? null;

        const elapsed = stepStartedAt ? now - new Date(stepStartedAt).getTime() : 0;
        const phaseLabel = phase ? `Phase ${phasesCompleted + 1}` : null;
        const stepLabel = step ? `Step ${step}` : null;
        const progressLabel = [phaseLabel, stepLabel].filter(Boolean).join(' ');

        return (
          <button
            key={job.projectPath || job.projectName}
            onClick={() => onSelectProject && onSelectProject(job.projectPath)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6ch',
              background: 'none',
              border: 'none',
              padding: '0.1rem 0.3rem',
              borderRadius: '3px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '0.75rem',
              lineHeight: 1.4,
              color: 'var(--color-text)',
              transition: 'background 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,255,65,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            title={`${job.projectName || job.repoName} — click to select`}
          >
            {/* Pulsing green dot */}
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--color-green)',
                flexShrink: 0,
                animation: 'pulse 1.8s ease-in-out infinite',
              }}
            />

            {/* Repo name */}
            <span style={{ color: 'var(--color-bright)', fontWeight: 600 }}>
              {job.repoName || job.projectName}
            </span>

            {/* Phase/step progress */}
            {progressLabel && (
              <span style={{ color: 'var(--color-muted)' }}>
                {progressLabel}
              </span>
            )}

            {/* Elapsed time */}
            {elapsed > 0 && (
              <span
                style={{
                  color: 'var(--color-subtle)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatElapsed(elapsed)}
              </span>
            )}

            {/* Cost */}
            {totalCost !== null && totalCost !== undefined && (
              <span
                style={{
                  color: 'var(--color-amber)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCost(totalCost)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

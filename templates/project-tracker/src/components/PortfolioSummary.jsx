import { formatCost } from '../lib/utils.js';

/**
 * Aggregate from API's pre-computed per-project values.
 */
function aggregateFromProjects(projects) {
  let done = 0;
  let total = 0;
  let cost = 0;

  if (!Array.isArray(projects)) return { done, total, cost, pct: 0 };

  for (const p of projects) {
    total += p.totalPhases || 0;
    done += p.completedPhases || 0;
    if (p.autoState && typeof p.autoState.total_cost_estimate === 'number') {
      cost += p.autoState.total_cost_estimate;
    }
  }

  return { done, total, cost, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

export function PortfolioSummary({ projects, autoJobCount }) {
  const { done, total, cost, pct } = aggregateFromProjects(projects);
  const projectCount = Array.isArray(projects) ? projects.length : 0;
  const autoSessions = autoJobCount || 0;

  const mono = {
    fontFamily: 'var(--font-family-mono)',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div className="stagger-item" style={{ '--stagger-index': 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {/* Summary text line */}
      <div style={{
        fontFamily: 'var(--font-family-sans)',
        fontSize: '13px',
        color: 'var(--color-text-secondary)',
        lineHeight: '20px',
      }}>
        <span style={mono}>{projectCount}</span> projects
        <span style={{ color: 'var(--color-text-tertiary)', margin: '0 6px' }}>{'\u00B7'}</span>
        <span style={mono}>{done}</span>/<span style={mono}>{total}</span> phases done
        <span style={{ color: 'var(--color-text-tertiary)', margin: '0 6px' }}>{'\u00B7'}</span>
        <span style={mono}>{autoSessions}</span> auto sessions
        <span style={{ color: 'var(--color-text-tertiary)', margin: '0 6px' }}>{'\u00B7'}</span>
        <span style={mono}>{formatCost(cost)}</span> today
      </div>

      {/* Progress bar */}
      <div style={{
        height: '3px',
        borderRadius: '1.5px',
        background: 'var(--color-border-subtle)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: pct + '%',
          borderRadius: '1.5px',
          background: 'var(--color-status-active)',
          transition: 'width 400ms var(--ease-expo)',
        }} />
      </div>
    </div>
  );
}

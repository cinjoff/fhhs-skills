import { relativeTime } from '../lib/utils.js';

export function ProjectCard({ project, onSelect, isSelected }) {
  const unavailable = project.status === 'unavailable';

  const cardStyle = {
    border: `1px solid ${isSelected ? 'var(--green)' : unavailable ? 'var(--border-dim, #333)' : 'var(--border)'}`,
    background: isSelected ? 'var(--surface-active, rgba(0,255,0,0.04))' : 'var(--surface)',
    borderRadius: '3px',
    padding: '0.85rem 1rem',
    cursor: unavailable ? 'default' : 'pointer',
    opacity: unavailable ? 0.5 : 1,
    transition: 'border-color 0.15s',
    minWidth: 0,
  };

  const handleClick = () => {
    if (!unavailable && onSelect) onSelect(project);
  };

  const repoName = project.conductorWorkspace
    ? project.conductorWorkspace.split('/').pop()
    : null;

  return (
    <div style={cardStyle} onClick={handleClick} role="button" tabIndex={unavailable ? -1 : 0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--bright)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 auto' }}>
          {project.name}
        </span>
        {repoName && (
          <span style={{ fontSize: '0.7rem', background: 'var(--surface-alt, #1a1a1a)', border: '1px solid var(--border)', borderRadius: '3px', padding: '0.1rem 0.4rem', color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {repoName}
          </span>
        )}
      </div>

      {unavailable ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--dim)' }}>Path not found</div>
      ) : (
        <>
          {/* Phase + progress */}
          <div style={{ fontSize: '0.75rem', color: 'var(--subtle)', marginBottom: '0.35rem' }}>
            <span style={{ color: 'var(--muted)' }}>{'//'}</span>{' '}
            {project.currentPhase || 'no active phase'}
            {project.totalPhases > 0 && (
              <span style={{ color: 'var(--dim)', marginLeft: '0.5ch' }}>
                — Phase {project.completedPhases}/{project.totalPhases}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {typeof project.progressPct === 'number' && (
            <div style={{ height: '3px', background: 'var(--surface-alt, #1a1a1a)', borderRadius: '2px', marginBottom: '0.45rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, project.progressPct))}%`, background: 'var(--green)', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          )}

          {/* Next item */}
          {project.nextItem && (
            <div style={{ fontSize: '0.75rem', color: 'var(--dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--green)', marginRight: '0.4ch' }}>{'>'}</span>
              {project.nextItem}
            </div>
          )}

          {/* Last activity */}
          {project.lastActivity && (
            <div style={{ fontSize: '0.7rem', color: 'var(--dim)', textAlign: 'right' }}>
              {relativeTime(project.lastActivity)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

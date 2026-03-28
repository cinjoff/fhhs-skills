import { h } from 'preact';

/**
 * Derive status dot color from project's pre-computed status and progress.
 */
function statusDotColor(project) {
  if (project.status === 'complete' || project.progressPct === 100) return 'var(--color-status-done)';
  if (project.status === 'active' || project.progressPct > 0) return 'var(--color-status-active)';
  if (project.status === 'failed' || project.status === 'blocked') return 'var(--color-status-error)';
  return 'var(--color-status-pending)';
}

/**
 * Group projects by conductorWorkspace for display.
 * Projects in the same conductor workspace are shown under a group header.
 */
function groupProjects(projects) {
  if (!Array.isArray(projects)) return [];
  const map = {};
  const groups = [];

  for (const p of projects) {
    const ws = p.conductorWorkspace || null;
    const key = ws || '__standalone__' + p.id;

    if (ws && map[ws]) {
      // Add to existing conductor group
      map[ws].projects.push(p);
    } else if (ws) {
      const group = { workspace: ws, label: ws, projects: [p] };
      map[ws] = group;
      groups.push(group);
    } else {
      // Standalone project — its own group
      const group = { workspace: null, label: null, projects: [p] };
      groups.push(group);
    }
  }

  return groups;
}

export function ProjectSidebar({ projects, selectedProjectId, onSelectProject }) {
  const groups = groupProjects(projects);

  // Aggregate for groups: best completion, worst status
  function groupPct(group) {
    const total = group.projects.reduce((s, p) => s + (p.totalPhases || 0), 0);
    const done = group.projects.reduce((s, p) => s + (p.completedPhases || 0), 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function groupHasAuto(group) {
    return group.projects.some(p => p.autoState && p.autoState.active);
  }

  function bestProject(group) {
    // Pick the project with the most progress or activity
    return group.projects.reduce((best, p) =>
      (p.progressPct || 0) >= (best.progressPct || 0) ? p : best
    , group.projects[0]);
  }

  return (
    <nav
      style={{
        background: 'var(--color-bg-raised)',
        padding: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        minWidth: 0,
      }}
      aria-label="Project list"
    >
      {groups.map((group, idx) => {
        const isMulti = group.workspace && group.projects.length > 1;
        const pct = groupPct(group);
        const hasAuto = groupHasAuto(group);
        const repr = bestProject(group);
        const isActive = group.projects.some(p => p.id === selectedProjectId);
        const displayName = group.workspace || repr.name || repr.id;

        return (
          <div key={displayName + idx}>
            {/* Group header for multi-project workspaces */}
            {isMulti && (
              <div style={{
                padding: '4px 12px 2px',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--color-text-tertiary)',
                marginTop: idx > 0 ? '8px' : '0',
              }}>
                {group.label}
              </div>
            )}

            {/* Render each project in the group */}
            {group.projects.map((p, pIdx) => {
              const projActive = p.id === selectedProjectId;
              const projPct = p.progressPct || 0;

              return (
                <div
                  key={p.id}
                  className="stagger-item"
                  role="button"
                  tabIndex="0"
                  aria-current={projActive ? 'true' : undefined}
                  style={{
                    '--stagger-index': idx * 3 + pIdx,
                    display: 'flex',
                    alignItems: 'center',
                    height: '36px',
                    padding: isMulti ? '0 8px 0 20px' : '0 8px',
                    cursor: 'pointer',
                    background: projActive ? 'var(--color-bg-overlay)' : 'transparent',
                    transition: 'background 150ms ease',
                    gap: '8px',
                    minWidth: 0,
                    borderRadius: '4px',
                    margin: '0 4px',
                  }}
                  onClick={() => onSelectProject(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProject(p.id);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!projActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = projActive ? 'var(--color-bg-overlay)' : 'transparent';
                  }}
                >
                  {/* Status dot */}
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: statusDotColor(p),
                    flexShrink: 0,
                  }} />

                  {/* Project name */}
                  <span style={{
                    fontFamily: 'var(--font-family-sans)',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--color-text-primary)',
                    opacity: projActive ? 1 : 0.65,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 150ms ease',
                  }}>
                    {p.name}
                  </span>

                  {/* Auto pulse dot */}
                  {p.autoState && p.autoState.active && (
                    <span style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-status-active)',
                      flexShrink: 0,
                      animation: 'pulse 2s infinite',
                    }} title="Auto session active" />
                  )}

                  {/* Completion % */}
                  <span style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '12px',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--color-text-tertiary)',
                    opacity: projActive ? 1 : 0.65,
                    flexShrink: 0,
                    transition: 'opacity 150ms ease',
                  }}>
                    {projPct}%
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

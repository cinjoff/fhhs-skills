import { useState, useEffect, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { groupProjectsAsTree } from '../lib/utils.js';

const LS_KEY = 'tracker-tree-state';

function loadTreeState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTreeState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const AutoDot = memo(function AutoDot() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'oklch(0.72 0.19 155)',
        flexShrink: 0,
        marginLeft: '2px',
      }}
      title="Auto-mode active"
      aria-label="auto-mode active"
    />
  );
});

const WorktreeRow = memo(function WorktreeRow({ project, isSelected, hasAuto, onSelect }) {
  const name = project.conductorWorkspace
    ? project.conductorWorkspace.split('/').pop()
    : project.path
      ? project.path.split('/').pop()
      : project.id || 'unknown';

  const displayName = project.worktreeName || name;

  const selectedStyle = isSelected
    ? {
        color: 'oklch(0.95 0.005 285)',
        borderLeft: '2px solid oklch(0.65 0.20 280)',
        paddingLeft: '6px',
        marginLeft: '-8px',
        backgroundColor: 'oklch(0.205 0.006 285)',
      }
    : {
        color: 'oklch(0.65 0.005 285)',
        borderLeft: '2px solid transparent',
        paddingLeft: '6px',
        marginLeft: '-8px',
      };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(project.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(project.id); } }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 4px 3px 0',
        cursor: 'pointer',
        fontSize: '0.75rem',
        lineHeight: '1.3',
        borderRadius: '2px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        transition: 'background-color 150ms ease',
        ...selectedStyle,
      }}
      aria-pressed={isSelected}
      title={displayName}
    >
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {displayName}
      </span>
      {hasAuto && <AutoDot />}
    </div>
  );
});

const RepoGroup = memo(function RepoGroup({ group, selectedProjectId, activeProjectPaths, onSelect, collapsed, onToggle }) {
  const { repo, worktrees } = group;
  const isMulti = worktrees.length > 1;
  const repoLabel = repo || 'other';

  const childrenStyle = {
    overflow: 'hidden',
    maxHeight: collapsed ? '0px' : `${worktrees.length * 28}px`,
    transition: 'max-height 220ms cubic-bezier(0.16, 1, 0.3, 1)',
    paddingLeft: '12px',
  };

  const isAnySelected = worktrees.some(p => p.id === selectedProjectId);

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 2px',
    fontSize: '0.75rem',
    color: isAnySelected && collapsed
      ? 'oklch(0.95 0.005 285)'
      : 'oklch(0.65 0.005 285)',
    cursor: isMulti ? 'pointer' : 'default',
    userSelect: 'none',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    borderRadius: '2px',
  };

  const hasAnyAuto = worktrees.some(p => activeProjectPaths.has(p.path || p.id));

  return (
    <div style={{ marginBottom: '4px' }}>
      {isMulti ? (
        <div
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
          style={headerStyle}
          aria-expanded={!collapsed}
          title={repoLabel}
        >
          <span style={{ flexShrink: 0, fontSize: '0.6rem', opacity: 0.6 }}>
            {collapsed ? '▶' : '▼'}
          </span>
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              fontWeight: 600,
            }}
          >
            {repoLabel}
          </span>
          {collapsed && worktrees.length > 1 && (
            <span
              style={{
                flexShrink: 0,
                fontSize: '0.65rem',
                color: 'oklch(0.45 0.005 285)',
                backgroundColor: 'oklch(0.235 0.006 285)',
                padding: '0 4px',
                borderRadius: '3px',
              }}
            >
              {worktrees.length}
            </span>
          )}
          {hasAnyAuto && collapsed && <AutoDot />}
        </div>
      ) : (
        <div style={{ ...headerStyle, overflow: 'hidden' }}>
          <span
            style={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              fontWeight: 600,
              opacity: 0.5,
            }}
            title={repoLabel}
          >
            {repoLabel}
          </span>
        </div>
      )}

      <div style={isMulti ? childrenStyle : undefined}>
        {worktrees.map((project) => {
          const hasAuto = activeProjectPaths.has(project.path || project.id);
          const isSelected = project.id === selectedProjectId;
          return (
            <WorktreeRow
              key={project.id}
              project={project}
              isSelected={isSelected}
              hasAuto={hasAuto}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );
});

export const ProjectTree = memo(function ProjectTree({ projects, autoJobs, selectedProjectId, onSelectProject }) {
  const [collapsedState, setCollapsedState] = useState({});

  useEffect(() => {
    setCollapsedState(loadTreeState());
  }, []);

  const tree = useMemo(() => groupProjectsAsTree(projects), [projects]);

  const activeProjectPaths = useMemo(() => {
    if (!Array.isArray(autoJobs)) return new Set();
    return new Set(autoJobs.map(j => j.projectPath).filter(Boolean));
  }, [autoJobs]);

  const handleToggle = (repoKey) => {
    setCollapsedState(prev => {
      const next = { ...prev, [repoKey]: !prev[repoKey] };
      saveTreeState(next);
      return next;
    });
  };

  const conductorGroups = tree.filter(g => g.repo !== null);
  const otherGroups = tree.filter(g => g.repo === null);

  const containerStyle = {
    width: '160px',
    flexShrink: 0,
    fontFamily: "'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    fontSize: '0.75rem',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '8px 8px 8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    borderRight: '1px solid oklch(0.235 0.006 285)',
  };

  const sectionLabelStyle = {
    fontSize: '0.65rem',
    color: 'oklch(0.45 0.005 285)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '4px',
    marginTop: '8px',
    padding: '0 2px',
  };

  return (
    <div style={containerStyle} aria-label="Project tree">
      {conductorGroups.map((group) => {
        const repoKey = group.repo || '__ungrouped__';
        const collapsed = group.worktrees.length > 1 ? !!collapsedState[repoKey] : false;
        return (
          <RepoGroup
            key={repoKey}
            group={group}
            selectedProjectId={selectedProjectId}
            activeProjectPaths={activeProjectPaths}
            onSelect={onSelectProject}
            collapsed={collapsed}
            onToggle={() => handleToggle(repoKey)}
          />
        );
      })}

      {otherGroups.length > 0 && (
        <>
          <div style={sectionLabelStyle}>Other</div>
          {otherGroups.map((group) => {
            return group.worktrees.map((project) => {
              const hasAuto = activeProjectPaths.has(project.path || project.id);
              const isSelected = project.id === selectedProjectId;
              return (
                <WorktreeRow
                  key={project.id}
                  project={project}
                  isSelected={isSelected}
                  hasAuto={hasAuto}
                  onSelect={onSelectProject}
                />
              );
            });
          })}
        </>
      )}
    </div>
  );
});

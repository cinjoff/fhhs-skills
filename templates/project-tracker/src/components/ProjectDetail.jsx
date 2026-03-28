import { h } from 'preact';
import { relativeTime, aggregateCompletion } from '../lib/utils.js';

/**
 * ProjectDetail — main content area for a selected project.
 * Renders the project header (name, phase indicator, progress bar)
 * and passes through children (AutoPipeline, PhaseGrid, ConcernsPanel, etc.)
 */
export function ProjectDetail({ project, phases, autoState, concerns, decisions, pendingDecisions, showToast, children }) {
  if (!project) return null;

  const { done, total, pct } = aggregateCompletion(phases || []);
  const currentPhase = (phases || []).findIndex(p => {
    const s = (p.status || '').toLowerCase();
    return s === 'active' || s === 'in_progress';
  });
  const currentPhaseNum = currentPhase >= 0 ? currentPhase + 1 : done;

  const sectionDelay = (index) => ({
    opacity: 0,
    animation: `stagger-fade-in 300ms ease-out ${index * 50}ms forwards`,
  });

  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
      flex: 1,
      minWidth: 0,
      overflowY: 'auto',
    },
  },
    // Keyframe injection
    h('style', null, `
      @keyframes stagger-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes progress-fill {
        from { width: 0%; }
      }
    `),

    // Header section
    h('div', { style: { ...sectionDelay(0) } },

      // Top row: project name + phase indicator
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '4px',
        },
      },
        h('h1', {
          style: {
            margin: 0,
            fontSize: '1.54rem',
            fontWeight: 600,
            fontFamily: 'var(--font-family-sans)',
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          },
        }, project.name || project.projectName || 'Untitled'),

        total > 0 && h('span', {
          style: {
            fontSize: '1rem',
            fontFamily: 'var(--font-family-mono)',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          },
        }, `Phase ${currentPhaseNum} of ${total}`),
      ),

      // Last activity
      project.lastActivity && h('span', {
        style: {
          display: 'block',
          fontSize: '12px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--color-text-tertiary)',
          marginBottom: '12px',
        },
      }, `Last activity ${relativeTime(project.lastActivity)}`),

      // Progress bar
      total > 0 && h('div', {
        style: {
          width: '100%',
          height: '3px',
          borderRadius: '1.5px',
          background: 'var(--color-border-subtle)',
          overflow: 'hidden',
        },
      },
        h('div', {
          style: {
            width: `${pct}%`,
            height: '100%',
            borderRadius: '1.5px',
            background: pct === 100
              ? 'var(--color-status-done)'
              : 'var(--color-status-active)',
            transition: 'width 400ms var(--ease-expo, cubic-bezier(0.16, 1, 0.3, 1))',
            animation: 'progress-fill 600ms ease-out',
          },
        }),
      ),
    ),

    // Children slots (AutoPipeline, PhaseGrid, ConcernsPanel, CostChart, ActivityFeed)
    children && h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      },
    },
      Array.isArray(children)
        ? children.map((child, i) =>
            child && h('div', {
              key: i,
              style: sectionDelay(i + 1),
            }, child)
          )
        : h('div', { style: sectionDelay(1) }, children),
    ),
  );
}

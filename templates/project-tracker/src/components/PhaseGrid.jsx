import { h } from 'preact';
import { useState } from 'preact/hooks';
import { mapStatus, statusIcon, statusColor } from '../lib/utils.js';

/**
 * PhaseGrid — compact phase rows with expandable task sub-rows.
 * Linear-inspired calm dark theme, 36px row heights.
 */
export function PhaseGrid({ phases }) {
  const [expanded, setExpanded] = useState({});

  if (!Array.isArray(phases) || phases.length === 0) return null;

  const doneCount = phases.filter(p => mapStatus(p.status) === 'done').length;

  const toggle = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    },
  },
    // Keyframe for stagger
    h('style', null, `
      @keyframes phase-row-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `),

    // Section header
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '8px',
      },
    },
      h('span', {
        style: {
          fontSize: '11px',
          fontFamily: 'var(--font-family-sans)',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
        },
      }, 'PHASES'),
      h('span', {
        style: {
          fontSize: '11px',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-text-tertiary)',
        },
      }, `${doneCount}/${phases.length} done`),
    ),

    // Separator
    h('div', {
      style: {
        height: '1px',
        background: 'var(--color-border-default)',
        marginBottom: '2px',
      },
    }),

    // Phase rows
    phases.map((phase, index) => {
      const status = mapStatus(phase.status);
      const isActive = status === 'active';
      const isDone = status === 'done';
      const phaseKey = phase.id || phase.name || index;
      const isExpanded = !!expanded[phaseKey];
      const tasks = Array.isArray(phase.tasks) ? phase.tasks : [];
      const tasksDone = tasks.filter(t => mapStatus(t.status) === 'done').length;
      // Derive phase display: prefer "Phase N: Name" format, fallback to just name
      const phaseNum = phase.id || (index + 1);
      const phaseName = phase.name || phase.goal || '';
      // If name starts with "#" it's a numeric ID, display as "Phase N"
      const phaseLabel = phaseName.startsWith('#') ? `Phase ${phaseName}` : phaseName;

      return h('div', {
        key: phaseKey,
        style: {
          '--stagger-index': index,
          opacity: 0,
          animation: `phase-row-in 200ms ease-out ${index * 50}ms forwards`,
        },
      },
        // Phase row
        h('div', {
          onClick: () => tasks.length > 0 && toggle(phaseKey),
          style: {
            display: 'flex',
            alignItems: 'center',
            height: '36px',
            padding: '0 8px',
            gap: '10px',
            borderRadius: '6px',
            cursor: tasks.length > 0 ? 'pointer' : 'default',
            background: isActive ? 'var(--color-bg-overlay)' : 'transparent',
            transition: 'background 150ms ease',
          },
          onMouseEnter: (e) => {
            if (!isActive) e.currentTarget.style.background = 'var(--color-bg-overlay)';
          },
          onMouseLeave: (e) => {
            if (!isActive) e.currentTarget.style.background = 'transparent';
          },
        },
          // Status icon
          h('span', {
            style: {
              fontSize: '12px',
              lineHeight: 1,
              color: statusColor(phase.status),
              width: '16px',
              textAlign: 'center',
              flexShrink: 0,
            },
          }, statusIcon(phase.status)),

          // Phase ID
          h('span', {
            style: {
              fontSize: '12px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-text-tertiary)',
              flexShrink: 0,
              minWidth: '64px',
            },
          }, `Phase ${phaseNum}`),

          // Phase name
          h('span', {
            style: {
              fontSize: '13px',
              fontFamily: 'var(--font-family-sans)',
              color: (isActive || isDone) ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }, phaseLabel),

          // Right-aligned: task count or active badge
          h('span', {
            style: {
              fontSize: '12px',
              fontFamily: 'var(--font-family-mono)',
              color: isActive ? 'var(--color-status-active)' : 'var(--color-text-tertiary)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            },
          },
            isActive
              ? h('span', {
                  style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-family-sans)',
                    fontWeight: 500,
                    background: 'color-mix(in oklch, var(--color-status-active) 15%, transparent)',
                    color: 'var(--color-status-active)',
                  },
                }, phase.completedPlans != null && phase.completedPlans < (phase.planCount || 1)
                  ? 'building'
                  : 'planning')
              : tasks.length > 0
                ? `${tasksDone}/${tasks.length}`
                : phase.planCount
                  ? `${phase.completedPlans || 0}/${phase.planCount}`
                  : null,

            // Expand chevron
            tasks.length > 0 && h('span', {
              style: {
                fontSize: '10px',
                color: 'var(--color-text-tertiary)',
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 150ms ease',
                display: 'inline-block',
              },
            }, '\u25B8'), // ▸
          ),
        ),

        // Expanded task sub-rows
        isExpanded && tasks.length > 0 && h('div', {
          style: {
            paddingLeft: '34px',
          },
        },
          tasks.map((task, ti) => {
            const ts = mapStatus(task.status);
            return h('div', {
              key: ti,
              style: {
                display: 'flex',
                alignItems: 'center',
                height: '32px',
                padding: '0 8px',
                gap: '8px',
                fontSize: '12px',
                fontFamily: 'var(--font-family-sans)',
                opacity: 0,
                animation: `phase-row-in 150ms ease-out ${ti * 30}ms forwards`,
              },
            },
              // Checkbox-style icon
              h('span', {
                style: {
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  border: ts === 'done'
                    ? '1.5px solid var(--color-status-done)'
                    : '1.5px solid var(--color-border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  color: 'var(--color-status-done)',
                  flexShrink: 0,
                  background: ts === 'done'
                    ? 'color-mix(in oklch, var(--color-status-done) 12%, transparent)'
                    : 'transparent',
                },
              }, ts === 'done' ? '\u2713' : ''),

              // Task description
              h('span', {
                style: {
                  flex: 1,
                  color: ts === 'done' ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                  textDecoration: ts === 'done' ? 'line-through' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                },
              }, task.description || task.name || `Task ${ti + 1}`),

              // Status text for non-done/pending
              ts === 'active' && h('span', {
                style: {
                  fontSize: '11px',
                  fontFamily: 'var(--font-family-mono)',
                  color: 'var(--color-status-active)',
                  flexShrink: 0,
                },
              }, 'active'),
            );
          }),
        ),
      );
    }),
  );
}

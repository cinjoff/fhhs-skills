import { h } from 'preact';
import { relativeTime } from '../lib/utils.js';

// ── Type colors ─────────────────────────────────────────────────────────────────

const typeColors = {
  build:   'var(--color-status-active)',
  review:  'var(--color-status-done)',
  auto:    'var(--color-status-warning)',
  plan:    'oklch(0.65 0.15 310)',  // purple
  error:   'var(--color-status-error)',
};

function typeColor(type) {
  return typeColors[(type || '').toLowerCase()] || 'var(--color-status-pending)';
}

// ── TypePill ────────────────────────────────────────────────────────────────────

function TypePill({ type }) {
  const color = typeColor(type);
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '10px',
      fontFamily: 'var(--font-family-sans)',
      fontWeight: 600,
      lineHeight: '1',
      padding: '2px 5px',
      borderRadius: '2px',
      color,
      background: color.replace(')', ' / 0.12)').replace('var(', '').startsWith('--')
        ? undefined
        : color + '1e', // fallback: append ~12% hex alpha
      backgroundColor: (() => {
        // Resolve a subtle background from the color
        // For CSS var colors, use a transparent overlay trick
        const c = typeColor(type);
        return undefined; // handled by individual cases below
      })(),
      textTransform: 'lowercase',
      flexShrink: 0,
      width: '48px',
      textAlign: 'center',
    }}>{type || 'misc'}</span>
  );
}

// Simpler pill using a pseudo-background approach
function ActivityTypePill({ type }) {
  const color = typeColor(type);
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '10px',
      fontFamily: 'var(--font-family-sans)',
      fontWeight: 600,
      lineHeight: '16px',
      padding: '0 5px',
      borderRadius: '2px',
      color,
      border: `1px solid ${color}`,
      opacity: 0.75,
      textTransform: 'lowercase',
      flexShrink: 0,
      minWidth: '40px',
      textAlign: 'center',
    }}>{type || 'misc'}</span>
  );
}

// ── ActivityRow ─────────────────────────────────────────────────────────────────

function ActivityRow({ activity, showProject, index }) {
  const { type, text, timestamp, project } = activity;

  return (
    <div
      class="stagger-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '3px 0',
        animationDelay: `${(index || 0) * 30}ms`,
      }}
    >
      {/* Relative timestamp */}
      <span style={{
        fontFamily: 'var(--font-family-mono)',
        fontSize: '11px',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--color-text-tertiary)',
        width: '60px',
        flexShrink: 0,
        textAlign: 'right',
      }}>{relativeTime(timestamp)}</span>

      {/* Type badge */}
      <ActivityTypePill type={type} />

      {/* Description */}
      <span style={{
        fontSize: '13px',
        fontFamily: 'var(--font-family-sans)',
        color: 'var(--color-text-primary)',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
      }}>{text}</span>

      {/* Project name (portfolio view) */}
      {showProject && project && (
        <span style={{
          fontSize: '12px',
          fontFamily: 'var(--font-family-sans)',
          color: 'var(--color-text-tertiary)',
          flexShrink: 0,
          textAlign: 'right',
        }}>{project}</span>
      )}
    </div>
  );
}

// ── ActivityFeed ────────────────────────────────────────────────────────────────

export function ActivityFeed({ activities, showProject }) {
  const items = Array.isArray(activities) ? activities.slice(0, 20) : [];

  return (
    <div>
      {/* Section header */}
      <div style={{
        fontSize: '11px',
        fontFamily: 'var(--font-family-sans)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--color-text-tertiary)',
        marginBottom: '8px',
      }}>Recent Activity</div>

      {items.length === 0 && (
        <div style={{
          fontSize: '12px',
          color: 'var(--color-text-tertiary)',
          padding: '8px 0',
        }}>No recent activity</div>
      )}

      {items.map((a, i) => (
        <ActivityRow
          key={a.timestamp + '-' + i}
          activity={a}
          showProject={!!showProject}
          index={i}
        />
      ))}
    </div>
  );
}

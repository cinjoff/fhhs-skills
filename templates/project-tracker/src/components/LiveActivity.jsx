import { h } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { phaseColor, relativeTime } from '../lib/animations.js';

const RECENT_WINDOW_MS = 30 * 1000;

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const ActivityRow = memo(function ActivityRow({ entry }) {
  const phase = entry.phaseHint ? String(entry.phaseHint).replace(/\D/g, '') : null;
  const color = phase ? phaseColor(phase) : '#808080';
  const lines = entry.lines || [];
  const text = lines.length > 0 ? lines[lines.length - 1] : '';

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '2px 0',
      animation: 'slideIn 0.15s ease',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.7rem',
      lineHeight: '1.4',
    }}>
      <span style={{ color: '#3a3a3a', flexShrink: 0, minWidth: '52px' }}>
        {formatTime(entry.timestamp)}
      </span>
      {phase && (
        <span style={{
          color,
          border: `1px solid ${color}`,
          borderRadius: '2px',
          padding: '0 3px',
          fontSize: '0.6rem',
          flexShrink: 0,
          alignSelf: 'center',
        }}>
          P{phase}
        </span>
      )}
      <span style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {text}
      </span>
    </div>
  );
});

function SkeletonRow() {
  return (
    <div style={{
      height: '18px',
      background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '2px',
      marginBottom: '4px',
    }} />
  );
}

export function LiveActivity({ activities, phases }) {
  const [filter, setFilter] = useState('all');
  const [userScrolled, setUserScrolled] = useState(false);
  const scrollRef = useRef(null);
  const prevLenRef = useRef(0);

  // Derive unique phase hints from last 30s of activity
  const now = Date.now();
  const recentPhases = [...new Set(
    (activities || [])
      .filter(a => a.timestamp && (now - new Date(a.timestamp).getTime()) < RECENT_WINDOW_MS)
      .map(a => a.phaseHint)
      .filter(Boolean)
      .map(p => String(p).replace(/\D/g, ''))
      .filter(p => p)
  )].sort((a, b) => Number(a) - Number(b));

  // Filter activities
  const filtered = filter === 'all'
    ? (activities || [])
    : (activities || []).filter(a => {
        const p = a.phaseHint ? String(a.phaseHint).replace(/\D/g, '') : null;
        return p === filter;
      });

  // Auto-scroll on new entries, unless user scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (filtered.length !== prevLenRef.current) {
      prevLenRef.current = filtered.length;
      if (!userScrolled) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [filtered.length, userScrolled]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setUserScrolled(!atBottom);
  };

  const handleScrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setUserScrolled(false);
  };

  // Count unique sessions
  const sessionIds = new Set((activities || []).map(a => a.sessionId).filter(Boolean));

  return (
    <div style={{ padding: '12px 14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--accent-success)',
          boxShadow: '0 0 6px var(--accent-success)',
          animation: 'pulse 2s infinite',
          flexShrink: 0,
        }} />
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          // live_sessions
        </span>
        {sessionIds.size > 0 && (
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>
            {sessionIds.size} session{sessionIds.size !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Phase filter tabs */}
      {recentPhases.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? '#2a2a2a' : 'transparent',
              border: `1px solid ${filter === 'all' ? '#444' : '#2a2a2a'}`,
              color: filter === 'all' ? 'var(--color-text)' : 'var(--color-text-tertiary)',
              borderRadius: '2px',
              padding: '1px 6px',
              fontSize: '0.65rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            All
          </button>
          {recentPhases.map(p => {
            const color = phaseColor(p);
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                style={{
                  background: filter === p ? `${color}22` : 'transparent',
                  border: `1px solid ${filter === p ? color : '#2a2a2a'}`,
                  color: filter === p ? color : 'var(--color-text-tertiary)',
                  borderRadius: '2px',
                  padding: '1px 6px',
                  fontSize: '0.65rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                P{p}
              </button>
            );
          })}
        </div>
      )}

      {/* Terminal output */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          maxHeight: '180px',
          overflowY: 'auto',
          position: 'relative',
          scrollbarWidth: 'thin',
          scrollbarColor: '#2a2a2a transparent',
        }}
      >
        {filtered.length === 0 ? (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : (
          filtered.map((entry, i) => (
            <ActivityRow key={`${entry.sessionId}-${entry.timestamp}-${i}`} entry={entry} />
          ))
        )}
      </div>

      {/* New entries badge */}
      {userScrolled && filtered.length > 0 && (
        <button
          onClick={handleScrollToBottom}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '4px',
            background: '#1a2a1a',
            border: '1px solid var(--accent-success)',
            color: 'var(--accent-success)',
            borderRadius: '2px',
            padding: '2px',
            fontSize: '0.65rem',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
          }}
        >
          ↓ new
        </button>
      )}
    </div>
  );
}

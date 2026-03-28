import { h } from 'preact';
import { useState } from 'preact/hooks';

// ── Styles ──────────────────────────────────────────────────────────────────────

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 0',
  cursor: 'pointer',
  userSelect: 'none',
  border: 'none',
  background: 'none',
  width: '100%',
  textAlign: 'left',
};

const labelStyle = {
  fontSize: '11px',
  fontFamily: 'var(--font-family-sans)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-text-tertiary)',
};

const countBadgeStyle = {
  fontFamily: 'var(--font-family-mono)',
  fontSize: '11px',
  color: 'var(--color-text-secondary)',
};

const severityColor = {
  critical: 'var(--color-status-error)',
  high: 'var(--color-status-warning)',
  medium: 'var(--color-text-secondary)',
  low: 'var(--color-text-tertiary)',
};

const confidenceColor = {
  HIGH: 'var(--color-status-done)',
  MED: 'var(--color-status-warning)',
  LOW: 'var(--color-status-error)',
};

// ── ConcernRow ──────────────────────────────────────────────────────────────────

function ConcernRow({ name, count, severity }) {
  const color = severityColor[severity] || severityColor.medium;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '4px',
      padding: '3px 0',
      fontSize: '13px',
      lineHeight: '1.4',
    }}>
      <span style={{ color, flexShrink: 0 }}>{name}</span>
      <span style={{
        flex: 1,
        borderBottom: '1px dotted var(--color-border-subtle)',
        minWidth: '16px',
        alignSelf: 'flex-end',
        marginBottom: '3px',
      }} />
      <span style={{
        fontFamily: 'var(--font-family-mono)',
        fontSize: '12px',
        color,
        flexShrink: 0,
        fontVariantNumeric: 'tabular-nums',
      }}>{count}</span>
    </div>
  );
}

// ── ConfidenceBadge ─────────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }) {
  const level = (confidence || '').toUpperCase();
  const color = confidenceColor[level] || 'var(--color-text-tertiary)';
  return (
    <span style={{
      fontFamily: 'var(--font-family-mono)',
      fontSize: '10px',
      fontWeight: 600,
      color,
      padding: '1px 5px',
      borderRadius: '2px',
      border: `1px solid ${color}`,
      opacity: 0.8,
      flexShrink: 0,
    }}>{level || '?'}</span>
  );
}

// ── DecisionRow ─────────────────────────────────────────────────────────────────

function DecisionRow({ decision, isPending, showToast }) {
  const [expanded, setExpanded] = useState(false);
  const [rationale, setRationale] = useState('');
  const [inflight, setInflight] = useState(false);

  const handleAction = async (action) => {
    if (action === 'dispute' && !rationale.trim()) return;
    setInflight(true);
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: decision.id, action, rationale: rationale.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast && showToast(action === 'accept' ? 'Decision accepted' : 'Decision disputed');
    } catch (err) {
      showToast && showToast(`Error: ${err.message}`);
    } finally {
      setInflight(false);
    }
  };

  return (
    <div style={{
      borderLeft: isPending ? '2px solid var(--color-status-warning)' : '2px solid transparent',
      paddingLeft: '10px',
      marginBottom: '4px',
    }}>
      {/* Summary row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 0',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <span style={{
          fontFamily: 'var(--font-family-mono)',
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          flexShrink: 0,
          width: '48px',
        }}>{decision.id}</span>
        <span style={{
          fontSize: '13px',
          color: 'var(--color-text-primary)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{decision.title}</span>
        <ConfidenceBadge confidence={decision.confidence} />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '8px 0 8px 48px',
          fontSize: '12px',
          lineHeight: '1.5',
        }}>
          {decision.context && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Context: </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{decision.context}</span>
            </div>
          )}
          {decision.decision && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Decision: </span>
              <span style={{ color: 'var(--color-text-primary)' }}>{decision.decision}</span>
            </div>
          )}
          {decision.affects && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Affects: </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {Array.isArray(decision.affects) ? decision.affects.join(', ') : decision.affects}
              </span>
            </div>
          )}

          {/* Pending actions */}
          {isPending && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                <button
                  disabled={inflight}
                  onClick={(e) => { e.stopPropagation(); handleAction('accept'); }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-status-done)',
                    color: 'var(--color-status-done)',
                    borderRadius: '3px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    cursor: inflight ? 'not-allowed' : 'pointer',
                    opacity: inflight ? 0.5 : 1,
                    fontFamily: 'var(--font-family-sans)',
                  }}
                >Accept</button>
                <button
                  disabled={inflight || !rationale.trim()}
                  onClick={(e) => { e.stopPropagation(); handleAction('dispute'); }}
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-status-warning)',
                    color: 'var(--color-status-warning)',
                    borderRadius: '3px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    cursor: (inflight || !rationale.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (inflight || !rationale.trim()) ? 0.5 : 1,
                    fontFamily: 'var(--font-family-sans)',
                  }}
                >Dispute</button>
              </div>
              <textarea
                value={rationale}
                onInput={(e) => setRationale(e.target.value)}
                placeholder="Rationale for dispute..."
                style={{
                  width: '100%',
                  minHeight: '48px',
                  background: 'var(--color-bg-root)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '3px',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'var(--font-family-sans)',
                  fontSize: '12px',
                  padding: '6px 8px',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ConcernsPanel ───────────────────────────────────────────────────────────────

export function ConcernsPanel({ concerns, decisions, pendingDecisions, showToast }) {
  const [concernsOpen, setConcernsOpen] = useState(false);
  const [decisionsOpen, setDecisionsOpen] = useState(false);

  const categories = concerns?.categories || [];
  const totalCount = concerns?.totalCount ?? categories.reduce((s, c) => s + (c.count || 0), 0);
  const pending = pendingDecisions || [];
  const resolved = decisions || [];
  const totalDecisions = pending.length;

  return (
    <div style={{ padding: '4px 0' }}>
      {/* ── Concerns Section ─────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setConcernsOpen(!concernsOpen)}
          style={sectionHeaderStyle}
        >
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', width: '10px' }}>
            {concernsOpen ? '\u25BE' : '\u25B8'}
          </span>
          <span style={labelStyle}>Concerns</span>
          <span style={countBadgeStyle}>({totalCount})</span>
        </button>

        {concernsOpen && (
          <div style={{ padding: '0 0 8px 18px' }}>
            {categories.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No concerns</div>
            )}
            {categories.map((cat) => (
              <ConcernRow
                key={cat.name}
                name={cat.name}
                count={cat.count}
                severity={cat.severity}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Pending Decisions Section ────────────────────────────────────── */}
      <div>
        <button
          onClick={() => setDecisionsOpen(!decisionsOpen)}
          style={sectionHeaderStyle}
        >
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: '11px', width: '10px' }}>
            {decisionsOpen ? '\u25BE' : '\u25B8'}
          </span>
          <span style={labelStyle}>Pending Decisions</span>
          <span style={countBadgeStyle}>({totalDecisions})</span>
        </button>

        {decisionsOpen && (
          <div style={{ padding: '0 0 8px 8px' }}>
            {pending.length === 0 && resolved.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>No decisions</div>
            )}
            {pending.map((d) => (
              <DecisionRow key={d.id} decision={d} isPending showToast={showToast} />
            ))}
            {resolved.map((d) => (
              <DecisionRow key={d.id} decision={d} isPending={false} showToast={showToast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

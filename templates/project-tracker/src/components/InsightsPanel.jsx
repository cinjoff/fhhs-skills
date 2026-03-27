import { useState, useEffect, useCallback } from 'preact/hooks';
import { memo } from 'preact/compat';

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

// ── Decision Item ────────────────────────────────────────────────────────────

const DecisionItem = memo(function DecisionItem({ decision, projectPath, onUpdate, showToast }) {
  const [inflight, setInflight] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [rationale, setRationale] = useState('');

  const isAccepted = decision.status === 'accepted';
  const isDisputed = decision.status === 'disputed';

  async function handleAccept() {
    if (inflight) return;
    setInflight(true);
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, decisionId: decision.id, action: 'accept' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onUpdate(data.decision || { ...decision, status: 'accepted' });
    } catch (err) {
      showToast(`Failed to accept decision: ${err.message}`, 'error');
    } finally {
      setInflight(false);
    }
  }

  async function handleDispute() {
    if (inflight) return;
    if (!rationale.trim()) {
      showToast('Rationale is required to dispute a decision.', 'error');
      return;
    }
    setInflight(true);
    try {
      const res = await fetch('/api/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath, decisionId: decision.id, action: 'dispute', rationale: rationale.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      onUpdate(data.decision || { ...decision, status: 'disputed' });
      setDisputeOpen(false);
      setRationale('');
    } catch (err) {
      showToast(`Failed to dispute decision: ${err.message}`, 'error');
    } finally {
      setInflight(false);
    }
  }

  const borderColor = isDisputed ? '#f87171' : isAccepted ? '#2a2a2a' : '#333';
  const bgColor = isDisputed ? 'rgba(248,113,113,0.05)' : isAccepted ? '#0f0f0f' : '#131313';
  const titleColor = isAccepted ? '#454550' : '#cccccc';

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      background: bgColor,
      borderRadius: '3px',
      padding: '8px 10px',
      marginBottom: '6px',
      transition: 'border-color 0.2s, background 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.65rem', color: '#606068', fontFamily: 'inherit', flexShrink: 0 }}>
          {decision.id || '—'}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: titleColor,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
          title={decision.title}
        >
          {decision.title || 'Untitled decision'}
        </span>
        {/* Action buttons — only when not yet accepted or disputed */}
        {!isAccepted && !isDisputed && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={handleAccept}
              disabled={inflight}
              title="Accept decision"
              style={{
                background: 'none',
                border: '1px solid #34d399',
                borderRadius: '2px',
                color: inflight ? '#454550' : '#34d399',
                cursor: inflight ? 'not-allowed' : 'pointer',
                fontSize: '0.65rem',
                padding: '1px 6px',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                transition: 'opacity 0.15s',
                opacity: inflight ? 0.5 : 1,
              }}
            >✓</button>
            <button
              onClick={() => setDisputeOpen(o => !o)}
              disabled={inflight}
              title="Dispute decision"
              style={{
                background: 'none',
                border: '1px solid #f87171',
                borderRadius: '2px',
                color: inflight ? '#454550' : '#f87171',
                cursor: inflight ? 'not-allowed' : 'pointer',
                fontSize: '0.65rem',
                padding: '1px 6px',
                fontFamily: 'inherit',
                lineHeight: '1.4',
                transition: 'opacity 0.15s',
                opacity: inflight ? 0.5 : 1,
              }}
            >✗</button>
          </div>
        )}
        {isAccepted && (
          <span style={{ fontSize: '0.6rem', color: '#34d399', flexShrink: 0 }}>accepted</span>
        )}
        {isDisputed && (
          <span style={{ fontSize: '0.6rem', color: '#f87171', flexShrink: 0 }}>disputed</span>
        )}
      </div>

      {/* Dispute input */}
      {disputeOpen && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #222', paddingTop: '8px' }}>
          <textarea
            value={rationale}
            onInput={e => setRationale(e.target.value)}
            placeholder="Rationale for dispute…"
            rows={2}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#0f0f0f',
              border: '1px solid #333',
              borderRadius: '2px',
              color: '#cccccc',
              fontSize: '0.7rem',
              fontFamily: 'inherit',
              padding: '4px 6px',
              resize: 'vertical',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setDisputeOpen(false); setRationale(''); }}
              style={{
                background: 'none',
                border: '1px solid #333',
                borderRadius: '2px',
                color: '#606068',
                cursor: 'pointer',
                fontSize: '0.65rem',
                padding: '2px 8px',
                fontFamily: 'inherit',
              }}
            >Cancel</button>
            <button
              onClick={handleDispute}
              disabled={inflight || !rationale.trim()}
              style={{
                background: 'none',
                border: '1px solid #f87171',
                borderRadius: '2px',
                color: (inflight || !rationale.trim()) ? '#454550' : '#f87171',
                cursor: (inflight || !rationale.trim()) ? 'not-allowed' : 'pointer',
                fontSize: '0.65rem',
                padding: '2px 8px',
                fontFamily: 'inherit',
                opacity: (inflight || !rationale.trim()) ? 0.5 : 1,
              }}
            >Submit</button>
          </div>
        </div>
      )}
    </div>
  );
});

// ── Observation Item ─────────────────────────────────────────────────────────

const ObservationItem = memo(function ObservationItem({ obs }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        borderBottom: '1px solid #1a1a1a',
        padding: '7px 0',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          fontSize: '0.6rem',
          color: '#606068',
          background: '#1a1a22',
          border: '1px solid #2a2a2a',
          borderRadius: '2px',
          padding: '1px 4px',
          fontFamily: 'inherit',
          flexShrink: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}>
          {obs.type || 'obs'}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: '#9898a0',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: expanded ? 'normal' : 'nowrap',
        }}
          title={obs.title}
        >
          {obs.title || 'Untitled'}
        </span>
        <span style={{ fontSize: '0.6rem', color: '#454550', fontFamily: 'inherit', flexShrink: 0 }}>
          {timeAgo(obs.date || obs.timestamp)}
        </span>
      </div>
      {expanded && obs.narrative && (
        <div style={{
          marginTop: '6px',
          fontSize: '0.7rem',
          color: '#606068',
          lineHeight: '1.5',
          paddingLeft: '2px',
        }}>
          {obs.narrative}
        </div>
      )}
    </div>
  );
});

// ── InsightsPanel ────────────────────────────────────────────────────────────

export function InsightsPanel({ decisions, selectedProject, showToast }) {
  const [localDecisions, setLocalDecisions] = useState(decisions || []);
  const [observations, setObservations] = useState([]);
  const [obsAvailable, setObsAvailable] = useState(true); // hide only when explicitly false

  // Sync external decisions prop into local state
  useEffect(() => {
    setLocalDecisions(decisions || []);
  }, [decisions]);

  // Fetch observations when project changes
  useEffect(() => {
    if (!selectedProject?.name) return;
    let cancelled = false;

    async function fetchObs() {
      try {
        const res = await fetch(
          `/api/claude-mem/observations?project=${encodeURIComponent(selectedProject.name)}&limit=10`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.available === false) {
          setObsAvailable(false);
          setObservations([]);
        } else {
          setObsAvailable(true);
          setObservations(data.observations || []);
        }
      } catch {
        if (!cancelled) {
          setObsAvailable(false);
          setObservations([]);
        }
      }
    }

    fetchObs();
    return () => { cancelled = true; };
  }, [selectedProject?.name]);

  const handleUpdate = useCallback((updated) => {
    setLocalDecisions(prev =>
      prev.map(d => d.id === updated.id ? { ...d, ...updated } : d)
    );
  }, []);

  // Sort: disputed first, then active, then accepted (muted) at bottom
  const sorted = [...localDecisions].sort((a, b) => {
    const rank = s => s === 'disputed' ? 0 : s === 'accepted' ? 2 : 1;
    return rank(a.status) - rank(b.status);
  });

  return (
    <div style={{
      width: '240px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: '#3a3a3a transparent',
      borderLeft: '1px solid #1a1a1a',
      background: '#0f0f0f',
    }}>
      {/* Decisions section */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{
          fontSize: '0.65rem',
          color: '#454550',
          fontFamily: 'inherit',
          letterSpacing: '0.05em',
          marginBottom: '10px',
          userSelect: 'none',
        }}>
          // decisions
        </div>

        {sorted.length === 0 ? (
          <div style={{ fontSize: '0.7rem', color: '#3a3a3a', textAlign: 'center', padding: '12px 0' }}>
            No decisions
          </div>
        ) : (
          sorted.map(d => (
            <DecisionItem
              key={d.id}
              decision={d}
              projectPath={selectedProject?.path}
              onUpdate={handleUpdate}
              showToast={showToast}
            />
          ))
        )}
      </div>

      {/* Observations section — hidden when not available */}
      {obsAvailable && (
        <div style={{ padding: '8px 12px 12px', borderTop: '1px solid #1a1a1a', marginTop: '4px' }}>
          <div style={{
            fontSize: '0.65rem',
            color: '#454550',
            fontFamily: 'inherit',
            letterSpacing: '0.05em',
            marginBottom: '6px',
            userSelect: 'none',
          }}>
            // observations
          </div>

          {observations.length === 0 ? (
            <div style={{ fontSize: '0.7rem', color: '#3a3a3a', textAlign: 'center', padding: '8px 0' }}>
              No observations
            </div>
          ) : (
            observations.map((obs, i) => (
              <ObservationItem key={obs.id || i} obs={obs} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

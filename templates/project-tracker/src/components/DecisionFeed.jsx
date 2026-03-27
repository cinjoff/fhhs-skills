import { useState } from 'preact/hooks';

const CONFIDENCE_STYLES = {
  HIGH: { label: 'HIGH', color: '#00ff41', bg: 'rgba(0,255,65,0.1)' },
  MEDIUM: { label: 'MED', color: '#ffb300', bg: 'rgba(255,179,0,0.1)' },
  LOW: { label: 'LOW', color: '#ff2d00', bg: 'rgba(255,45,0,0.1)' },
};

function DecisionCard({ decision }) {
  const [expanded, setExpanded] = useState(false);
  const conf = CONFIDENCE_STYLES[decision.confidence] || CONFIDENCE_STYLES.MEDIUM;
  const needsReview = decision.status === 'NEEDS_REVIEW' || decision.needs_review;

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        border: needsReview ? '1px solid #ffb300' : '1px solid #222222',
        background: needsReview ? 'rgba(255,179,0,0.04)' : '#131313',
        borderRadius: '3px',
        padding: '8px 10px',
        cursor: 'pointer',
        marginBottom: '6px',
        animation: 'fadeUp 0.3s ease',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: expanded ? '6px' : 0 }}>
        {needsReview && (
          <span style={{ color: '#ffb300', fontSize: '0.7rem', flexShrink: 0 }}>⚠</span>
        )}
        <span style={{
          fontSize: '0.65rem',
          color: '#808080',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}>
          {decision.id || '—'}
        </span>
        <span style={{
          fontSize: '0.75rem',
          color: '#cccccc',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: expanded ? 'normal' : 'nowrap',
        }}>
          {decision.title || decision.summary || 'Untitled decision'}
        </span>
        <span style={{
          fontSize: '0.65rem',
          color: conf.color,
          background: conf.bg,
          border: `1px solid ${conf.color}`,
          borderRadius: '2px',
          padding: '1px 5px',
          flexShrink: 0,
          fontFamily: 'inherit',
        }}>
          {conf.label}
        </span>
        {decision.status && (
          <span style={{
            fontSize: '0.65rem',
            color: needsReview ? '#ffb300' : '#808080',
            flexShrink: 0,
          }}>
            {decision.status}
          </span>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #222', paddingTop: '8px' }}>
          {decision.context && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '0.65rem', color: '#808080' }}>context: </span>
              <span style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>{decision.context}</span>
            </div>
          )}
          {decision.decision && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '0.65rem', color: '#808080' }}>decision: </span>
              <span style={{ fontSize: '0.7rem', color: '#e8e8e8' }}>{decision.decision}</span>
            </div>
          )}
          {decision.affects && decision.affects.length > 0 && (
            <div>
              <span style={{ fontSize: '0.65rem', color: '#808080' }}>affects: </span>
              <span style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>{Array.isArray(decision.affects) ? decision.affects.join(', ') : decision.affects}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DecisionFeed({ decisions }) {
  if (!decisions || decisions.length === 0) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: '#3a3a3a',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
      }}>
        No autonomous decisions yet
      </div>
    );
  }

  // Newest first
  const sorted = [...decisions].reverse();

  return (
    <div style={{
      maxHeight: '400px',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: '#3a3a3a transparent',
    }}>
      {sorted.map((d, i) => (
        <DecisionCard key={d.id || i} decision={d} />
      ))}
    </div>
  );
}

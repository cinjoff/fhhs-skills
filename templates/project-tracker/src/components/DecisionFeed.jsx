import { h } from 'preact';
import { useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import { phaseColor } from '../lib/animations.js';

const CONFIDENCE_STYLES = {
  HIGH: { label: 'HIGH', color: '#00ff41', bg: 'rgba(0,255,65,0.1)' },
  MEDIUM: { label: 'MED', color: '#ffb300', bg: 'rgba(255,179,0,0.1)' },
  LOW: { label: 'LOW', color: '#ff2d00', bg: 'rgba(255,45,0,0.1)' },
};

const DecisionCard = memo(function DecisionCard({ decision, index }) {
  const [expanded, setExpanded] = useState(false);
  const conf = CONFIDENCE_STYLES[decision.confidence] || CONFIDENCE_STYLES.MEDIUM;
  const needsReview = decision.status === 'NEEDS_REVIEW' || decision.needs_review;
  const isPending = decision.source === 'pending';

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        border: needsReview ? '1px solid #ffb300' : isPending ? '1px dashed #444' : '1px solid #222222',
        background: needsReview ? 'rgba(255,179,0,0.04)' : '#131313',
        borderRadius: '3px',
        padding: '8px 10px',
        cursor: 'pointer',
        marginBottom: '6px',
        animation: 'fadeUp 0.3s ease',
        animationDelay: `${(index || 0) * 30}ms`,
        '--index': index || 0,
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
        {isPending && (
          <span style={{
            fontSize: '0.6rem',
            color: '#ffb300',
            border: '1px solid #ffb300',
            borderRadius: '2px',
            padding: '0 3px',
            flexShrink: 0,
            fontFamily: 'inherit',
          }}>
            ⟳ pending
          </span>
        )}
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
});

function PhaseGroup({ phaseNum, items, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const color = phaseColor(phaseNum);
  const hasPending = items.some(d => d.source === 'pending');

  return (
    <div style={{ marginBottom: '10px' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderLeft: hasPending ? `2px dashed ${color}` : `2px solid ${color}`,
          cursor: 'pointer',
          marginBottom: '6px',
        }}
      >
        <span style={{ fontSize: '0.7rem', color, fontFamily: 'inherit' }}>
          Phase {phaseNum}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#808080' }}>
          {items.length} decision{items.length !== 1 ? 's' : ''}
        </span>
        {hasPending && (
          <span style={{
            fontSize: '0.6rem',
            color: '#ffb300',
            border: '1px solid #ffb300',
            borderRadius: '2px',
            padding: '0 3px',
            fontFamily: 'inherit',
          }}>
            ⟳ pending
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#444' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: '8px' }}>
          {items.map((d, i) => (
            <DecisionCard key={d.id || i} decision={d} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export function DecisionFeed({ decisions, pendingDecisions }) {
  const allDecisions = decisions || [];
  const allPending = pendingDecisions || [];

  // Auto-detect "by phase" view: pending decisions or 3+ distinct phases
  const allItems = [...allDecisions, ...allPending];
  const distinctPhases = new Set(allItems.map(d => d.phase).filter(Boolean));
  const autoByPhase = allPending.length > 0 || distinctPhases.size >= 3;

  const [view, setView] = useState(autoByPhase ? 'phase' : 'all');

  if (allItems.length === 0) {
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

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        <button
          onClick={() => setView('phase')}
          style={{
            background: 'transparent',
            border: 'none',
            color: view === 'phase' ? 'var(--color-text)' : 'var(--color-text-tertiary)',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontFamily: 'inherit',
            padding: '0',
          }}
        >
          [by phase {view === 'phase' ? '▾' : '▸'}]
        </button>
        <button
          onClick={() => setView('all')}
          style={{
            background: 'transparent',
            border: 'none',
            color: view === 'all' ? 'var(--color-text)' : 'var(--color-text-tertiary)',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontFamily: 'inherit',
            padding: '0',
          }}
        >
          [all {view === 'all' ? '▾' : '▸'}]
        </button>
      </div>

      {view === 'all' ? (
        // Flat list, newest first (existing behavior)
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3a3a3a transparent',
        }}>
          {[...allDecisions].reverse().map((d, i) => (
            <DecisionCard key={d.id || i} decision={d} index={i} />
          ))}
        </div>
      ) : (
        // By phase view: merge + group by phase ascending
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#3a3a3a transparent',
        }}>
          {(() => {
            // Group all decisions by phase number
            const groups = {};
            for (const d of allItems) {
              const pNum = parseInt(d.phase, 10);
              const key = isNaN(pNum) ? 0 : pNum;
              if (!groups[key]) groups[key] = [];
              groups[key].push(d);
            }
            const sortedKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
            return sortedKeys.map(phaseNum => {
              const items = groups[phaseNum];
              const hasPending = items.some(d => d.source === 'pending');
              return (
                <PhaseGroup
                  key={phaseNum}
                  phaseNum={phaseNum}
                  items={items}
                  defaultExpanded={hasPending}
                />
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}

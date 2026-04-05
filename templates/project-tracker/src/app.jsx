import { useState, useRef, useEffect } from 'preact/hooks';
import { render } from 'preact';
import { useToast, useSSE, useAbortFetch } from './lib/hooks.js';
import { relativeTime } from './lib/utils.js';
import { ProjectSidebar } from './components/ProjectSidebar.jsx';
import { ProjectDetail } from './components/ProjectDetail.jsx';
import { PhaseGrid } from './components/PhaseGrid.jsx';
import { AutoPipeline } from './components/AutoPipeline.jsx';
import { ConcernsPanel } from './components/ConcernsPanel.jsx';
import { CostChart } from './components/CostChart.jsx';
import { ActivityFeed } from './components/ActivityFeed.jsx';
import { PortfolioView } from './components/PortfolioView.jsx';

const ACTIVITY_BATCH_MS = 100;

// Skeleton shimmer block
function SkeletonBlock({ width, height, style }) {
  return (
    <div class="skeleton" style={{
      width: width || '100%',
      height: height || '16px',
      ...style,
    }} />
  );
}

function LoadingSkeleton() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--color-bg-root)',
    }}>
      {/* Header skeleton */}
      <div style={{
        gridColumn: '1 / -1',
        padding: '10px 16px',
        borderBottom: '1px solid var(--color-border-default)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <SkeletonBlock width="120px" height="14px" />
        <SkeletonBlock width="60px" height="14px" />
        <SkeletonBlock width="100px" height="14px" style={{ marginLeft: 'auto' }} />
      </div>
      {/* Sidebar skeleton */}
      <div style={{
        borderRight: '1px solid var(--color-border-default)',
        padding: '12px 8px',
        background: 'var(--color-bg-raised)',
      }}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonBlock key={i} height="36px" style={{ marginBottom: '4px', borderRadius: '6px' }} />
        ))}
      </div>
      {/* Main content skeleton */}
      <div style={{ padding: '24px' }}>
        <SkeletonBlock height="24px" style={{ marginBottom: '16px', width: '40%' }} />
        <SkeletonBlock height="3px" style={{ marginBottom: '24px', borderRadius: '2px' }} />
        <SkeletonBlock height="120px" style={{ marginBottom: '16px', borderRadius: '8px' }} />
        <SkeletonBlock height="200px" style={{ borderRadius: '8px' }} />
      </div>
    </div>
  );
}

function ConnectionIndicator({ connected, lastUpdated, disconnectedSince }) {
  const showWarning = disconnectedSince && (Date.now() - disconnectedSince.getTime()) > 30000;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '11px',
      fontFamily: 'var(--font-family-mono)',
      color: showWarning ? 'var(--color-status-warning)' : 'var(--color-text-tertiary)',
    }}>
      <div style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: connected ? 'var(--color-status-done)' : showWarning ? 'var(--color-status-warning)' : 'var(--color-status-pending)',
        ...(connected ? {} : showWarning ? { animation: 'pulse 2s infinite' } : {}),
      }} />
      {lastUpdated && (
        <span>Last updated: {relativeTime(lastUpdated.toISOString())}</span>
      )}
    </div>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [toast, showToast] = useToast();
  const [activities, setActivities] = useState([]);
  const activityBufRef = useRef([]);
  const activityFlushRef = useRef(null);
  const fetchWithAbort = useAbortFetch();

  // Fetch initial activity buffer
  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(items => {
        if (Array.isArray(items)) setActivities(items);
      })
      .catch(() => {});
  }, []);

  const { connected, lastUpdated, disconnectedSince } = useSSE((d) => {
    // SSE data callback — can receive function updater or direct data
    if (typeof d === 'function') {
      setData(d);
    } else {
      setData(d);
    }
    const name = (d && d.active && d.active.project && d.active.project.name)
      || (d && d.project && d.project.name)
      || 'Tracker';
    if (typeof d !== 'function') {
      document.title = name + ' — tracker';
    }
  }, (eventType, eventData) => {
    if (eventType === 'activity') {
      activityBufRef.current.push(eventData);
      if (!activityFlushRef.current) {
        activityFlushRef.current = setTimeout(() => {
          activityFlushRef.current = null;
          const batch = activityBufRef.current.splice(0);
          if (batch.length > 0) {
            setActivities(prev => {
              const next = [...prev, ...batch];
              return next.length > 200 ? next.slice(next.length - 200) : next;
            });
          }
        }, ACTIVITY_BATCH_MS);
      }
    }
  });

  if (!data) return <LoadingSkeleton />;

  const projects = data.projects || [];
  const autoJobs = data.autoJobs || [];
  const autoJobCount = Array.isArray(autoJobs) ? autoJobs.length : (typeof autoJobs === 'number' ? autoJobs : 0);

  // Find selected project data
  const activeProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : null;
  const activeData = activeProject ? (data.active || data) : null;

  const handleSelectProject = (projectId) => {
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    if (project && project.path) {
      fetchWithAbort(`/api/state?project=${encodeURIComponent(project.path)}`)
        .then(r => r.json())
        .then(fetched => {
          if (fetched && fetched.active) {
            setData(prev => prev ? { ...prev, active: fetched.active } : prev);
          }
        })
        .catch(err => {
          if (err.name !== 'AbortError') console.warn('Fetch failed:', err);
        });
    }
  };

  // Extract data for the active project
  const phases = activeData ? (activeData.stages || activeData.phases || []) : [];
  const autoState = activeData ? (activeData.autoState || null) : null;
  const concerns = activeData ? (activeData.concerns || { categories: [], totalCount: 0 }) : { categories: [], totalCount: 0 };
  const decisions = activeData ? (activeData.decisions || []) : [];
  const pendingDecisions = activeData ? (activeData.pendingDecisions || []) : [];
  const costData = activeData ? (activeData.costHistory || []) : [];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--color-bg-root)',
    }}>
      {/* Header bar — full width */}
      <div style={{
        gridColumn: '1 / -1',
        gridRow: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid var(--color-border-default)',
        background: 'var(--color-bg-root)',
        height: '40px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}>
            Tracker
          </span>
          {autoJobCount > 0 && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-status-active)',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--color-status-active)',
                animation: 'pulse 2s infinite',
              }} />
              Auto: {autoJobCount} running
            </span>
          )}
        </div>
        <ConnectionIndicator
          connected={connected}
          lastUpdated={lastUpdated}
          disconnectedSince={disconnectedSince}
        />
      </div>

      {/* Sidebar — row 2, col 1 */}
      <div style={{
        gridColumn: '1',
        gridRow: '2',
        overflowY: 'auto',
        borderRight: '1px solid var(--color-border-default)',
        background: 'var(--color-bg-raised)',
      }}>
        <ProjectSidebar
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
        />
      </div>

      {/* Main content — row 2, col 2 */}
      <div style={{
        gridColumn: '2',
        gridRow: '2',
        overflowY: 'auto',
        background: 'var(--color-bg-root)',
      }}>
        {!activeProject ? (
          /* Portfolio overview when no project selected */
          projects.length > 0 ? (
            <PortfolioView
              projects={projects}
              activities={activities}
              autoJobCount={autoJobCount}
            />
          ) : (
            /* Empty state */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
            }}>
              <p style={{
                color: 'var(--color-text-tertiary)',
                fontSize: '14px',
              }}>
                No projects registered yet.
              </p>
              <p style={{
                color: 'var(--color-text-tertiary)',
                fontSize: '13px',
              }}>
                Run <code style={{
                  fontFamily: 'var(--font-family-mono)',
                  color: 'var(--color-status-active)',
                  background: 'var(--color-bg-raised)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}>/fh:tracker register</code> to add your first project.
              </p>
            </div>
          )
        ) : (
          /* Selected project detail */
          <div style={{ padding: '16px 24px', animation: 'fadeIn 150ms ease-out' }}>
            <ProjectDetail
              project={activeProject}
              phases={phases}
            >
              {autoState && autoState.active && (
                <AutoPipeline autoState={autoState} />
              )}

              <PhaseGrid phases={phases} />

              <ConcernsPanel
                concerns={concerns}
                decisions={decisions}
                pendingDecisions={pendingDecisions}
                showToast={showToast}
              />

              {costData.length > 0 && (
                <CostChart data={costData} title="Session Costs" />
              )}

              <ActivityFeed activities={(() => {
                const autoActivities = (autoState && autoState.activity_events) || [];
                const merged = [...activities];
                for (const evt of autoActivities) {
                  const isDup = merged.some(a => a.timestamp === evt.timestamp && a.text === evt.text);
                  if (!isDup) {
                    merged.push({ type: evt.type, text: evt.text, timestamp: evt.timestamp });
                  }
                }
                merged.sort((a, b) => (b.timestamp || b.time || '').localeCompare(a.timestamp || a.time || ''));
                return merged.slice(0, 20);
              })()} />
            </ProjectDetail>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-bg-raised)',
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-text-primary)',
          fontSize: '12px',
          padding: '8px 16px',
          borderRadius: '6px',
          zIndex: 10000,
          animation: 'fadeIn 100ms ease-out',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

render(<App />, document.getElementById('app'));

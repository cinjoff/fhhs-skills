import { useState, useRef, useEffect } from 'preact/hooks';
import { render } from 'preact';
import { useToast, useSSE } from './lib/hooks.js';
import { TopBar } from './components/TopBar.jsx';
import { ProjectTree } from './components/ProjectTree.jsx';
import { DetailPanel } from './components/DetailPanel.jsx';
import { InsightsPanel } from './components/InsightsPanel.jsx';
import { LiveActivity } from './components/LiveActivity.jsx';

// Skeleton shimmer block
function SkeletonBlock({ width, height, style }) {
  return (
    <div style={{
      width: width || '100%',
      height: height || '16px',
      background: 'linear-gradient(90deg, #1a1a1a 25%, #242424 50%, #1a1a1a 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: '2px',
      ...style,
    }} />
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 240px', gridTemplateRows: 'auto 1fr', height: '100vh', overflow: 'hidden' }}>
      {/* TopBar skeleton */}
      <div style={{ gridColumn: '1 / -1', gridRow: '1', padding: '10px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <SkeletonBlock width="120px" height="14px" />
        <SkeletonBlock width="60px" height="14px" />
        <SkeletonBlock width="80px" height="14px" style={{ marginLeft: 'auto' }} />
      </div>
      {/* Left sidebar skeleton */}
      <div style={{ gridColumn: '1', gridRow: '2', borderRight: '1px solid #1a1a1a', padding: '12px' }}>
        <SkeletonBlock height="12px" style={{ marginBottom: '8px' }} />
        <SkeletonBlock height="12px" style={{ marginBottom: '8px', width: '80%' }} />
        <SkeletonBlock height="12px" style={{ marginBottom: '8px', width: '90%' }} />
        <SkeletonBlock height="12px" style={{ width: '70%' }} />
      </div>
      {/* Main content skeleton */}
      <div style={{ gridColumn: '2', gridRow: '2', padding: '16px' }}>
        <SkeletonBlock height="20px" style={{ marginBottom: '16px', width: '40%' }} />
        <SkeletonBlock height="12px" style={{ marginBottom: '8px' }} />
        <SkeletonBlock height="12px" style={{ marginBottom: '8px', width: '85%' }} />
        <SkeletonBlock height="12px" style={{ marginBottom: '24px', width: '70%' }} />
        <SkeletonBlock height="80px" style={{ marginBottom: '12px' }} />
        <SkeletonBlock height="80px" />
      </div>
      {/* Right panel skeleton */}
      <div style={{ gridColumn: '3', gridRow: '2', borderLeft: '1px solid #1a1a1a', padding: '12px' }}>
        <SkeletonBlock height="12px" style={{ marginBottom: '10px', width: '60%' }} />
        <SkeletonBlock height="40px" style={{ marginBottom: '8px' }} />
        <SkeletonBlock height="40px" style={{ marginBottom: '8px' }} />
        <SkeletonBlock height="40px" />
      </div>
    </div>
  );
}

const ACTIVITY_BATCH_MS = 100;

function App() {
  const [data, setData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, showToast] = useToast();
  const [activities, setActivities] = useState([]);
  const activityBufRef = useRef([]);
  const activityFlushRef = useRef(null);

  // Fetch initial activity buffer on mount
  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(items => {
        if (Array.isArray(items)) setActivities(items);
      })
      .catch(() => {});
  }, []);

  const { connected } = useSSE((d) => {
    setData(d);
    const name = (d.active && d.active.project && d.active.project.name)
      || (d.project && d.project.name)
      || 'Project';
    document.title = name + ' \u2014 tracker';

    // On SSE refresh, re-fetch full state for the selected project
    if (selectedProject && selectedProject.path) {
      fetch(`/api/state?project=${encodeURIComponent(selectedProject.path)}`)
        .then(r => r.json())
        .then(fetched => {
          if (fetched && fetched.active) {
            setData(prev => prev ? { ...prev, active: fetched.active } : prev);
          }
        })
        .catch(() => {});
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

  if (!data) {
    return <LoadingSkeleton />;
  }

  const projects = data.projects || [];
  const repoCount = data.repoCount || projects.length || 0;
  const autoJobs = data.autoJobs || 0;

  // Active project — selected by user or first in list
  const activeProject = selectedProject || (projects.length > 0 ? projects[0] : null);
  const activeData = data.active || data;

  // Detect if auto mode is active for any project
  const hasActiveAuto = Array.isArray(autoJobs) && autoJobs.length > 0;

  const handleSelectProject = (projectId) => {
    const project = projects.find(p => p.id === projectId) || null;
    setSelectedProject(project);
    if (project && project.path) {
      fetch(`/api/state?project=${encodeURIComponent(project.path)}`)
        .then(r => r.json())
        .then(fetched => {
          if (fetched && fetched.active) {
            setData(prev => prev ? { ...prev, active: fetched.active } : prev);
          }
        })
        .catch(() => {});
    }
  };

  // Filter decisions to product/architecture category for InsightsPanel
  const allDecisions = activeData ? (activeData.decisions || []) : [];
  const insightDecisions = allDecisions.filter(d => {
    const cat = (d.category || '').toLowerCase();
    return cat === 'product' || cat === 'architecture' || cat === 'arch';
  });

  const pendingDecisions = activeData ? (activeData.pendingDecisions || []) : [];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '160px 1fr 240px',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* TopBar — full width, row 1 */}
      <div style={{ gridColumn: '1 / -1', gridRow: '1' }}>
        <TopBar
          repoCount={repoCount}
          autoJobs={autoJobs}
          connected={connected}
        />
      </div>

      {/* ProjectTree — row 2, col 1 */}
      <div style={{ gridColumn: '1', gridRow: '2', overflowY: 'auto', borderRight: '1px solid var(--color-border)' }}>
        <ProjectTree
          projects={projects}
          autoJobs={autoJobs}
          selectedProjectId={activeProject ? activeProject.id : null}
          onSelectProject={handleSelectProject}
        />
      </div>

      {/* DetailPanel — row 2, col 2 */}
      <div style={{ gridColumn: '2', gridRow: '2', overflowY: 'auto' }}>
        {/* LiveActivity: show between header and chart grid when auto is active */}
        {hasActiveAuto && (
          <LiveActivity activities={activities} phases={activeData ? activeData.stages : []} />
        )}
        <DetailPanel
          activeData={activeData}
          connected={connected}
          showToast={showToast}
          pendingDecisions={pendingDecisions}
        />
      </div>

      {/* InsightsPanel — row 2, col 3 */}
      <div style={{ gridColumn: '3', gridRow: '2', overflowY: 'auto', borderLeft: '1px solid var(--color-border)' }}>
        <InsightsPanel
          decisions={insightDecisions}
          pendingDecisions={pendingDecisions}
          activeData={activeData}
        />
      </div>

      {/* Toast */}
      <div
        style={{ gridColumn: '1 / -1', gridRow: '1 / -1', pointerEvents: 'none', zIndex: 10000 }}
        class="flex items-end justify-center pb-6"
      >
        <div class={`bg-surface border border-green text-green font-[inherit] text-[0.8rem] px-5 py-[0.4rem] rounded-[3px] transition-opacity duration-200 ${toast ? 'opacity-100' : 'opacity-0'}`}>
          {toast}
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));

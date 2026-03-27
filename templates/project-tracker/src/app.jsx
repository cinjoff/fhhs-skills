import { useState } from 'preact/hooks';
import { render } from 'preact';
import { useToast, useSSE } from './lib/hooks.js';
import { TopBar } from './components/TopBar.jsx';
import { ProjectTree } from './components/ProjectTree.jsx';
import { DetailPanel } from './components/DetailPanel.jsx';
import { InsightsPanel } from './components/InsightsPanel.jsx';

function App() {
  const [data, setData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, showToast] = useToast();

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
  });

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="text-[1.1rem] font-bold text-bright">
          <span className="text-green mr-[0.75ch] font-normal">{'>'}</span>
          {' loading'}<span className="blink">_</span>
        </span>
      </div>
    );
  }

  const projects = data.projects || [];
  const repoCount = data.repoCount || projects.length || 0;
  const autoJobs = data.autoJobs || 0;

  // Active project — selected by user or first in list
  const activeProject = selectedProject || (projects.length > 0 ? projects[0] : null);
  const activeData = data.active || data;

  const handleSelectProject = (project) => {
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
          activeProject={activeProject}
          onSelect={handleSelectProject}
        />
      </div>

      {/* DetailPanel — row 2, col 2 */}
      <div style={{ gridColumn: '2', gridRow: '2', overflowY: 'auto' }}>
        <DetailPanel
          activeData={activeData}
          connected={connected}
          showToast={showToast}
        />
      </div>

      {/* InsightsPanel — row 2, col 3 */}
      <div style={{ gridColumn: '3', gridRow: '2', overflowY: 'auto', borderLeft: '1px solid var(--color-border)' }}>
        <InsightsPanel
          decisions={insightDecisions}
          activeData={activeData}
        />
      </div>

      {/* Toast */}
      <div
        style={{ gridColumn: '1 / -1', gridRow: '1 / -1', pointerEvents: 'none', zIndex: 10000 }}
        className="flex items-end justify-center pb-6"
      >
        <div className={`bg-surface border border-green text-green font-[inherit] text-[0.8rem] px-5 py-[0.4rem] rounded-[3px] transition-opacity duration-200 ${toast ? 'opacity-100' : 'opacity-0'}`}>
          {toast}
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));

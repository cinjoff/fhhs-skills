import { useState, useMemo } from 'preact/hooks';
import { render } from 'preact';
import { useToast, useSSE } from './lib/hooks.js';
import { groupByMilestone, groupByConductor } from './lib/utils.js';
import { Header } from './components/Header.jsx';
import { Stats } from './components/Stats.jsx';
import { MilestoneGroup } from './components/Milestones.jsx';
import { WorkingOn } from './components/WorkingOn.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { AutoPipeline } from './components/AutoPipeline.jsx';
import { DecisionFeed } from './components/DecisionFeed.jsx';
import { CostChart } from './components/CostChart.jsx';
import { StepTimeline } from './components/StepTimeline.jsx';
import { ProjectCard } from './components/ProjectCard.jsx';
import { DailyMetrics } from './components/DailyMetrics.jsx';

function DetailView({ activeData, connected, showToast }) {
  const milestones = useMemo(
    () => activeData ? groupByMilestone(activeData.stages || []) : [],
    [activeData]
  );

  const autoState = activeData.autoState || null;
  const decisions = activeData.decisions || [];
  const isAutoActive = autoState && autoState.active === true;
  const hasLastRunData = !isAutoActive && autoState && autoState.step_history && autoState.step_history.length > 0;

  return (
    <>
      <Header data={activeData} connected={connected} />
      <Stats data={activeData} />

      {/* Auto-mode panels — shown when auto-mode is active */}
      {isAutoActive && (
        <div className="mb-6">
          <div className="text-[0.8rem] text-dim mb-3">
            <span className="text-muted">{'//'}</span>
            {' '}
            <span className="text-green font-bold">auto_mode</span>
            {' '}
            <span className="text-muted">— running</span>
            <span className="blink text-green ml-1">_</span>
          </div>
          <AutoPipeline autoState={autoState} />
          <div className="grid grid-cols-[1fr_280px] gap-4 max-[800px]:grid-cols-1">
            <div className="flex flex-col gap-4">
              <CostChart autoState={autoState} />
              <StepTimeline autoState={autoState} />
            </div>
            <div>
              <div className="text-[0.75rem] text-dim mb-2">
                <span className="text-muted">{'//'}</span> decisions
              </div>
              <DecisionFeed decisions={decisions} />
            </div>
          </div>
        </div>
      )}

      {/* Last run summary — collapsed, shown when auto-mode inactive but data exists */}
      {hasLastRunData && (
        <details className="mb-6">
          <summary className="cursor-pointer text-[0.8rem] text-dim mb-2 flex items-center gap-2">
            <span className="arrow inline-block transition-transform duration-150">▶</span>
            <span className="text-muted">{'//'}</span>
            <span className="text-subtle">last_run_summary</span>
          </summary>
          <div className="mt-3 grid grid-cols-[1fr_280px] gap-4 max-[800px]:grid-cols-1">
            <div className="flex flex-col gap-4">
              <CostChart autoState={autoState} />
              <StepTimeline autoState={autoState} />
            </div>
            <div>
              <div className="text-[0.75rem] text-dim mb-2">
                <span className="text-muted">{'//'}</span> decisions
              </div>
              <DecisionFeed decisions={decisions} />
            </div>
          </div>
        </details>
      )}

      <div className="grid grid-cols-[1fr_260px] gap-8 max-[800px]:grid-cols-1">
        <div className="flex flex-col gap-px min-w-0">
          {milestones.map((ms, i) => (
            <MilestoneGroup ms={ms} showToast={showToast} index={i} key={`ms-${i}-${ms.name}`} />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <section>
            <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> working_on</div>
            <WorkingOn data={activeData} />
          </section>
          <Sidebar data={activeData} showToast={showToast} />
        </div>
      </div>
    </>
  );
}

function App() {
  const [data, setData] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [toast, showToast] = useToast();
  const { connected } = useSSE((d) => {
    if (typeof d === 'function') {
      setData(d);
    } else {
      setData(d);
      const name = (d.active && d.active.project && d.active.project.name)
        || (d.project && d.project.name)
        || 'Project';
      document.title = name + ' \u2014 tracker';
    }
  });

  if (!data) {
    return (
      <div className="max-w-[1100px] mx-auto p-6">
        <span className="text-[1.1rem] font-bold text-bright">
          <span className="text-green mr-[0.75ch] font-normal">{'>'}</span>
          {' loading'}<span className="blink">_</span>
        </span>
      </div>
    );
  }

  // Detect multi-project mode: API returns { projects: [...], active: {...} }
  const isMultiProject = data.projects && data.projects.length > 1;

  // When a project card is clicked, fetch that project's full state
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    if (project && project.path) {
      fetch(`/api/state?project=${encodeURIComponent(project.path)}`)
        .then(r => r.json())
        .then(d => { if (d && d.active) setData(prev => ({ ...prev, active: d.active })); })
        .catch(() => {});
    }
  };

  // In single-project mode, fall back to data itself as active (backwards compat)
  const activeData = data.active || data;

  if (!isMultiProject) {
    return (
      <div className="max-w-[1100px] mx-auto p-6">
        <DetailView activeData={activeData} connected={connected} showToast={showToast} />
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-green text-green font-[inherit] text-[0.8rem] px-5 py-[0.4rem] rounded-[3px] transition-opacity duration-200 pointer-events-none z-[10000] ${toast ? 'opacity-100' : 'opacity-0'}`}>
          {toast}
        </div>
      </div>
    );
  }

  // Multi-project mode
  const conductorGroups = groupByConductor(data.projects);
  const activeProject = selectedProject || (data.projects.length > 0 ? data.projects[0] : null);

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      {/* Daily metrics hero — on-demand */}
      <DailyMetrics />

      {/* Project grid grouped by conductor workspace */}
      <div className="mb-6">
        <div className="text-[0.75rem] text-dim mb-3">
          <span className="text-muted">{'//'}</span>{' '}
          <span className="text-subtle">projects</span>
          <span className="text-dim ml-2">({data.projects.length})</span>
        </div>
        {conductorGroups.map((group) => (
          <div key={group.conductorWorkspace || '__ungrouped__'} className="mb-5">
            {group.label && (
              <div className="text-[0.7rem] text-muted mb-2 flex items-center gap-2">
                <span style={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>{group.label}</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.5rem' }}>
              {group.projects.map((p) => (
                <ProjectCard
                  key={p.path || p.name}
                  project={p}
                  isSelected={activeProject && activeProject.name === p.name}
                  onSelect={handleSelectProject}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail view for selected project */}
      {activeData && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <DetailView activeData={activeData} connected={connected} showToast={showToast} />
        </div>
      )}

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-green text-green font-[inherit] text-[0.8rem] px-5 py-[0.4rem] rounded-[3px] transition-opacity duration-200 pointer-events-none z-[10000] ${toast ? 'opacity-100' : 'opacity-0'}`}>
        {toast}
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));

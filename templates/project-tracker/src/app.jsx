import { useState, useMemo } from 'preact/hooks';
import { render } from 'preact';
import { useToast, useSSE } from './lib/hooks.js';
import { groupByMilestone } from './lib/utils.js';
import { Header } from './components/Header.jsx';
import { Stats } from './components/Stats.jsx';
import { MilestoneGroup } from './components/Milestones.jsx';
import { WorkingOn } from './components/WorkingOn.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { AutoPipeline } from './components/AutoPipeline.jsx';
import { DecisionFeed } from './components/DecisionFeed.jsx';
import { CostChart } from './components/CostChart.jsx';
import { StepTimeline } from './components/StepTimeline.jsx';

function App() {
  const [data, setData] = useState(null);
  const [toast, showToast] = useToast();
  const { connected } = useSSE((d) => {
    setData(d);
    document.title = ((d.project && d.project.name) || 'Project') + ' \u2014 tracker';
  });

  const milestones = useMemo(
    () => data ? groupByMilestone(data.stages || []) : [],
    [data]
  );

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

  const autoState = data.autoState || null;
  const decisions = data.decisions || [];
  const isAutoActive = autoState && autoState.active === true;
  const hasLastRunData = !isAutoActive && autoState && autoState.step_history && autoState.step_history.length > 0;

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      <Header data={data} connected={connected} />
      <Stats data={data} />

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
            <WorkingOn data={data} />
          </section>
          <Sidebar data={data} showToast={showToast} />
        </div>
      </div>
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface border border-green text-green font-[inherit] text-[0.8rem] px-5 py-[0.4rem] rounded-[3px] transition-opacity duration-200 pointer-events-none z-[10000] ${toast ? 'opacity-100' : 'opacity-0'}`}>
        {toast}
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app'));

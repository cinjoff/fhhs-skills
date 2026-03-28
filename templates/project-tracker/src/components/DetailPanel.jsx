import { useMemo } from 'preact/hooks';
import { groupByMilestone } from '../lib/utils.js';
import { Header } from './Header.jsx';
import { Stats } from './Stats.jsx';
import { MilestoneGroup } from './Milestones.jsx';
import { WorkingOn } from './WorkingOn.jsx';
import { Sidebar } from './Sidebar.jsx';
import { AutoPipeline } from './AutoPipeline.jsx';
import { DecisionFeed } from './DecisionFeed.jsx';
import { CostChart } from './CostChart.jsx';
import { StepTimeline } from './StepTimeline.jsx';

export function DetailPanel({ activeData, connected, showToast, pendingDecisions }) {
  const milestones = useMemo(
    () => activeData ? groupByMilestone(activeData.stages || []) : [],
    [activeData]
  );

  if (!activeData) {
    return (
      <div className="flex items-center justify-center h-full text-dim text-[0.85rem]">
        <span>select a project</span>
      </div>
    );
  }

  const autoState = activeData.autoState || null;
  const decisions = activeData.decisions || [];
  const pending = pendingDecisions || [];
  const isAutoActive = autoState && autoState.active === true;
  const hasLastRunData = !isAutoActive && autoState && autoState.step_history && autoState.step_history.length > 0;

  return (
    <div className="p-4 flex flex-col gap-4 min-w-0">
      <Header data={activeData} connected={connected} />
      <Stats data={activeData} />

      {/* Auto-mode panels — shown when auto-mode is active */}
      {isAutoActive && (
        <div className="mb-2">
          <div className="text-[0.8rem] text-dim mb-3">
            <span className="text-muted">{'//'}</span>
            {' '}
            <span className="text-green font-bold">auto_mode</span>
            {' '}
            <span className="text-muted">— running</span>
            <span className="blink text-green ml-1">_</span>
          </div>
          <AutoPipeline autoState={autoState} />
          <div className="grid grid-cols-[1fr_280px] gap-4 mt-4 max-[700px]:grid-cols-1">
            <div className="flex flex-col gap-4">
              <CostChart autoState={autoState} />
              <StepTimeline autoState={autoState} />
            </div>
            <div>
              <div className="text-[0.75rem] text-dim mb-2">
                <span className="text-muted">{'//'}</span> decisions
              </div>
              <DecisionFeed decisions={decisions} pendingDecisions={pending} />
            </div>
          </div>
        </div>
      )}

      {/* Last run summary — collapsed, shown when auto-mode inactive but data exists */}
      {hasLastRunData && (
        <details className="mb-2">
          <summary className="cursor-pointer text-[0.8rem] text-dim mb-2 flex items-center gap-2">
            <span className="arrow inline-block transition-transform duration-150">▶</span>
            <span className="text-muted">{'//'}</span>
            <span className="text-subtle">last_run_summary</span>
          </summary>
          <div className="mt-3 grid grid-cols-[1fr_280px] gap-4 max-[700px]:grid-cols-1">
            <div className="flex flex-col gap-4">
              <CostChart autoState={autoState} />
              <StepTimeline autoState={autoState} />
            </div>
            <div>
              <div className="text-[0.75rem] text-dim mb-2">
                <span className="text-muted">{'//'}</span> decisions
              </div>
              <DecisionFeed decisions={decisions} pendingDecisions={pending} />
            </div>
          </div>
        </details>
      )}

      <div className="grid grid-cols-[1fr_260px] gap-8 max-[700px]:grid-cols-1">
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
    </div>
  );
}

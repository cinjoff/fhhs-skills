import { useState, useMemo } from 'preact/hooks';
import { render } from 'preact';
import { useToast, useSSE } from './lib/hooks.js';
import { groupByMilestone } from './lib/utils.js';
import { Header } from './components/Header.jsx';
import { Stats } from './components/Stats.jsx';
import { MilestoneGroup } from './components/Milestones.jsx';
import { WorkingOn } from './components/WorkingOn.jsx';
import { Sidebar } from './components/Sidebar.jsx';

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

  return (
    <div className="max-w-[1100px] mx-auto p-6">
      <Header data={data} connected={connected} />
      <Stats data={data} />
      <div className="grid grid-cols-[1fr_260px] gap-8 max-[800px]:grid-cols-1">
        <div className="flex flex-col gap-px">
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

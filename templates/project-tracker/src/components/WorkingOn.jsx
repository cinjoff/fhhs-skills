import { mapStatus } from '../lib/utils.js';

export function WorkingOn({ data }) {
  const stages = data.stages || [];
  let activeTask = null;
  for (const stage of stages) {
    if (mapStatus(stage.status) === 'a' && stage.tasks) {
      for (const task of stage.tasks) {
        if (mapStatus(task.status) === 'a') {
          activeTask = task;
          break;
        }
      }
      if (activeTask) break;
    }
  }

  // Also check data.workingOn
  if (!activeTask && data.workingOn?.task) {
    activeTask = {
      name: data.workingOn.task,
      subtasks: data.workingOn.subtasks || [],
    };
  }

  if (!activeTask || !activeTask.subtasks || activeTask.subtasks.length === 0) {
    return <div className="text-[0.8rem] text-dim py-[0.15rem] italic">no active task</div>;
  }

  let dc = 0;
  const subs = activeTask.subtasks.map((st, i) => {
    const isDone = st.status === 'done' || st.status === 'complete';
    const isAct = st.status === 'in_progress' || st.status === 'active';
    if (isDone) dc++;
    const nameCls = isDone ? 'text-muted line-through' : (isAct ? 'text-bright' : 'text-subtle');
    return (
      <div className="flex items-center gap-[1ch] text-[0.8rem] py-[0.12rem]" key={st.name || i}>
        {isDone
          ? <span className="w-[1.5ch] text-center shrink-0 text-xs text-green">{'\u2713'}</span>
          : isAct
            ? <span className="w-[1.5ch] text-center shrink-0 text-xs text-fire"><span className="blink">{'\u258C'}</span></span>
            : <span className="w-[1.5ch] text-center shrink-0 text-xs text-dim">{'\u00B7'}</span>
        }
        <span className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${nameCls}`}>{st.name}</span>
      </div>
    );
  });

  const wp = activeTask.subtasks.length > 0 ? Math.round(dc / activeTask.subtasks.length * 100) : 0;

  return (
    <div className="border border-[rgba(255,45,0,0.35)] bg-surface p-[0.65rem]">
      <div className="font-bold text-[0.85rem] text-bright mb-[0.4rem]">{activeTask.name || 'Current Task'}</div>
      {subs}
      <div className="h-0.5 bg-dim mt-[0.6rem] overflow-hidden">
        <div className="h-full bg-fire transition-[width] duration-300 ease-out" style={{ width: wp + '%' }} />
      </div>
    </div>
  );
}

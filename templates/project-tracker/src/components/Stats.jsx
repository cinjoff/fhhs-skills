import { mapStatus } from '../lib/utils.js';

export function Stats({ data }) {
  const stages = data.stages || [];
  const total = stages.length;
  const done = stages.filter(s => mapStatus(s.status) === 'c').length;
  const active = stages.filter(s => mapStatus(s.status) === 'a').length;
  const deferred = stages.filter(s => mapStatus(s.status) === 'd').length;
  const todosN = (data.todos?.pending?.length) || (data.backlog?.length) || 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const tags = data.tags || {};

  return (
    <div className="flex items-center flex-wrap gap-y-2 gap-x-[1.5ch] pb-5 mb-5 border-b border-border">
      <span className="text-[0.85rem] text-subtle whitespace-nowrap [font-variant-numeric:tabular-nums]">
        <span className="text-green font-bold">{done}</span>
        <span className="text-text">/{total}</span>
      </span>
      <div className="flex-1 min-w-16 h-0.5 bg-dim overflow-hidden">
        <div
          className="h-full bg-green transition-[width] duration-500 ease-out shadow-[0_0_8px_rgba(0,255,65,0.25)]"
          style={{ width: pct + '%' }}
        />
      </div>
      <div className="flex flex-wrap gap-y-[0.35rem] gap-x-[2ch] text-[0.85rem] text-muted">
        {active > 0 ? <span><span className="font-bold text-fire">{active}</span> active</span> : null}
        {deferred > 0 ? <span><span className="font-bold text-amber">{deferred}</span> deferred</span> : null}
        {todosN > 0 ? <span><span className="font-bold text-amber">{todosN}</span> backlog</span> : null}
        {tags.planned ? <span><span className="font-bold">{tags.planned}</span> planned</span> : null}
      </div>
    </div>
  );
}

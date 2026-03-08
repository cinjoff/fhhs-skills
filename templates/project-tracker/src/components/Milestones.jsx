import { memo } from 'preact/compat';
import { mapStatus, copyToClipboard } from '../lib/utils.js';

function PlanList({ tasks }) {
  return (
    <div className="pl-[6ch] py-[0.15rem] pb-1 min-w-0">
      {tasks.map((tk, i) => {
        const tst = mapStatus(tk.status);
        const tic = tst === 'c' ? '\u2713' : (tst === 'a' ? '\u25B6' : '\u00B7');
        return (
          <div className="flex items-baseline gap-[0.75ch] py-[0.1rem] text-[0.8rem] overflow-hidden min-w-0" key={tk.name || i}>
            <span className={`w-[1.2ch] text-center shrink-0 text-xs ${tst === 'c' ? 'text-green' : tst === 'a' ? 'text-fire' : 'text-dim'}`}>{tic}</span>
            <span className="text-text whitespace-nowrap shrink-0">{tk.name}</span>
            {tk.objective ? <span className="text-[0.7rem] text-muted ml-[0.5ch] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap flex-1">{tk.objective}</span> : null}
          </div>
        );
      })}
    </div>
  );
}

function PhaseRow({ ph, showToast }) {
  const st = mapStatus(ph.status);
  const ic = st === 'c' ? '\u2713' : (st === 'a' ? '\u25B6' : (st === 'd' ? '~' : '\u00B7'));
  const hasTasks = ph.tasks && ph.tasks.length > 0;
  const shouldOpen = st === 'a';

  if (hasTasks) {
    const pd = ph.tasks.filter(t => mapStatus(t.status) === 'c').length;
    const needsBuild = st !== 'c' && st !== 'd' && pd < ph.tasks.length;
    return (
      <details className="m-0 min-w-0" open={shouldOpen || undefined}>
        <summary className="cursor-pointer flex items-center gap-[1ch] py-[0.2rem] text-[0.85rem]">
          <span className="arrow text-muted text-[0.6rem] w-[1ch] text-center inline-block transition-transform duration-150 ease-out shrink-0">{'\u25B8'}</span>
          <span className={`w-[1.5ch] text-center shrink-0 text-[0.8rem] ${st === 'c' ? 'text-green' : st === 'a' ? 'text-fire' : st === 'd' ? 'text-amber opacity-70' : 'text-dim'}`}>{ic}</span>
          <span className="[font-variant-numeric:tabular-nums] text-dim w-[2.5ch] text-right shrink-0">{ph.number}</span>
          <span className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${st === 'c' ? 'text-muted' : st === 'a' ? 'text-bright' : st === 'd' ? 'text-dim' : 'text-subtle'}`}>{ph.name}</span>
          <span className="text-[0.7rem] text-dim [font-variant-numeric:tabular-nums] shrink-0">{pd}/{ph.tasks.length}</span>
          {st === 'a' ? <span className="text-[0.7rem] shrink-0 text-fire">active</span> : null}
          {st === 'd' ? <span className="text-[0.7rem] shrink-0 text-amber opacity-75">deferred</span> : null}
          {needsBuild ? (
            <button
              className="inline-block font-[inherit] text-[0.65rem] text-muted border border-dim bg-transparent px-2 py-[0.1rem] rounded-[3px] cursor-pointer ml-[0.5ch] transition-colors duration-150 whitespace-nowrap shrink-0 hover:text-green hover:border-green focus-visible:text-green focus-visible:border-green focus-visible:outline-1 focus-visible:outline-green focus-visible:outline-offset-1"
              aria-label={`Build phase ${ph.number}`}
              onClick={(e) => { e.preventDefault(); copyToClipboard(`/build phase ${ph.number}: ${ph.name}`, showToast); }}
            >[build]</button>
          ) : null}
        </summary>
        <PlanList tasks={ph.tasks} />
      </details>
    );
  }

  // No tasks — unplanned phase, show [plan] only
  return (
    <div className="flex items-center gap-[1ch] py-[0.2rem] text-[0.85rem]">
      <span className={`w-[1.5ch] text-center shrink-0 text-[0.8rem] ${st === 'c' ? 'text-green' : st === 'a' ? 'text-fire' : st === 'd' ? 'text-amber opacity-70' : 'text-dim'}`}>{ic}</span>
      <span className="[font-variant-numeric:tabular-nums] text-dim w-[2.5ch] text-right shrink-0">{ph.number}</span>
      <span className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${st === 'c' ? 'text-muted' : st === 'a' ? 'text-bright' : st === 'd' ? 'text-dim' : 'text-subtle'}`}>{ph.name}</span>
      {st !== 'c' && st !== 'd' ? (
        <>
          <span className="text-[0.65rem] text-dim italic shrink-0">tbd</span>
          <button
            className="inline-block font-[inherit] text-[0.65rem] text-muted border border-dim bg-transparent px-2 py-[0.1rem] rounded-[3px] cursor-pointer ml-[0.5ch] transition-colors duration-150 whitespace-nowrap shrink-0 hover:text-green hover:border-green focus-visible:text-green focus-visible:border-green focus-visible:outline-1 focus-visible:outline-green focus-visible:outline-offset-1"
            aria-label={`Plan phase ${ph.number}`}
            onClick={() => copyToClipboard(`/plan-work phase ${ph.number}: ${ph.name}`, showToast)}
          >[plan]</button>
        </>
      ) : null}
      {st === 'a' ? <span className="text-[0.7rem] shrink-0 text-fire">active</span> : null}
      {st === 'd' ? <span className="text-[0.7rem] shrink-0 text-amber opacity-75">deferred</span> : null}
    </div>
  );
}

export const MilestoneGroup = memo(function MilestoneGroup({ ms, showToast, index }) {
  const t = ms.phases.length;
  const d = ms.phases.filter(p => mapStatus(p.status) === 'c').length;
  const allDone = d === t;
  const hasAct = ms.phases.some(p => mapStatus(p.status) === 'a');
  const ico = allDone ? '\u2713' : (hasAct ? '\u25B6' : '\u00B7');
  const icoCls = allDone ? 'text-green' : (hasAct ? 'text-fire' : 'text-dim');

  const firstN = ms.phases[0].number;
  const lastN = ms.phases[ms.phases.length - 1].number;
  const rng = firstN === lastN ? String(firstN) : `${firstN}\u2013${lastN}`;
  const shouldOpen = hasAct || (!allDone && d > 0);
  const barPct = t > 0 ? Math.round(d / t * 100) : 0;

  return (
    <details
      className={`bg-surface border border-border animate-[fadeUp_0.2s_ease-out_both] min-w-0${hasAct ? ' border-[rgba(255,45,0,0.3)]' : ''}`}
      open={shouldOpen || undefined}
      style={{ animationDelay: `${(index || 0) * 0.04}s` }}
    >
      <summary className="cursor-pointer flex items-center gap-[1ch] px-3 py-2 select-none">
        <span className="arrow text-muted text-[0.7rem] w-[1.2ch] text-center inline-block transition-transform duration-150 ease-out">{'\u25B8'}</span>
        <span className={`w-[1.5ch] text-center text-[0.8rem] shrink-0 ${icoCls}`}>{ico}</span>
        <span className="font-bold text-[0.9rem] text-bright flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{ms.name}</span>
        <span className="text-xs text-muted mr-[0.5ch]">{rng}</span>
        <div className="w-12 h-0.5 bg-dim overflow-hidden shrink-0">
          <div className={`h-full transition-[width] duration-300 ease-out ${allDone ? 'bg-green' : 'bg-fire'}`} style={{ width: barPct + '%' }} />
        </div>
        <span className="text-xs text-muted [font-variant-numeric:tabular-nums] shrink-0">{d}/{t}</span>
      </summary>
      <div className="px-3 pb-2 animate-[cFade_0.15s_ease-out] min-w-0 overflow-hidden">
        {ms.phases.map(ph => <PhaseRow ph={ph} showToast={showToast} key={ph.number} />)}
      </div>
    </details>
  );
});

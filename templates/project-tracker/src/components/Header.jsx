import { relativeTime } from '../lib/utils.js';

export function Header({ data, connected }) {
  const project = data.project || {};
  const milestone = data.milestone || {};
  const lastAct = data.lastActivity
    || data.state?.lastActivity
    || (data.recentActivity && data.recentActivity.length > 0
      ? { date: data.recentActivity[0].time, description: data.recentActivity[0].text }
      : null);

  let lastActText = '';
  if (lastAct && lastAct.date) {
    const ago = relativeTime(lastAct.date);
    const agoStr = ago === 'now' ? 'just now' : `${ago} ago`;
    lastActText = `Last: ${agoStr}` + (lastAct.description ? ` \u2014 ${lastAct.description}` : '');
  }

  return (
    <header className="flex items-start justify-between mb-3 gap-[1ch]">
      <div className="flex flex-col min-w-0 flex-1 gap-[0.15rem]">
        <div className="flex items-baseline gap-[1.5ch]">
          <h1 className="text-[1.1rem] font-bold text-bright whitespace-nowrap">
            <span className="text-green mr-[0.75ch] font-normal">{'>'}</span>
            {project.name || '...'}
          </h1>
          {milestone.name ? <span className="text-muted text-[0.85rem]">{milestone.name}</span> : null}
        </div>
        {lastActText ? (
          <span className="text-dim text-xs overflow-hidden text-ellipsis whitespace-nowrap">{lastActText}</span>
        ) : null}
      </div>
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 self-center ${
          connected
            ? 'bg-green shadow-[0_0_6px_rgba(0,255,65,0.5)] animate-[pulse_2s_ease-in-out_infinite]'
            : 'bg-fire'
        }`}
      />
    </header>
  );
}

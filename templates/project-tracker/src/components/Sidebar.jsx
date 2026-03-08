import { useState } from 'preact/hooks';
import { memo } from 'preact/compat';
import { relativeTime, daysBetween, extractProblemSection, extractFirstParagraph, copyToClipboard } from '../lib/utils.js';

const ConcernsPanel = memo(function ConcernsPanel({ concerns }) {
  if (!concerns || !concerns.categories || concerns.categories.length === 0) return null;

  return (
    <section>
      <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> concerns</div>
      {concerns.categories.map((cat, i) => (
        <div className="flex items-center gap-[1ch] text-[0.8rem] py-[0.15rem]" key={cat.name || i}>
          <span className="text-subtle flex-1">{cat.name}</span>
          <span className="text-amber text-xs [font-variant-numeric:tabular-nums]">({cat.count})</span>
        </div>
      ))}
    </section>
  );
});

const CodebaseFreshness = memo(function CodebaseFreshness({ data, showToast }) {
  const cf = data.codebaseFreshness;
  if (!cf || !cf.lastUpdated) return null;

  const days = daysBetween(cf.lastUpdated);
  const isStale = cf.isStale || days > 7;
  const label = days === 0 ? 'Updated today' : days === 1 ? 'Updated 1d ago' : `Updated ${days}d ago`;

  return (
    <section>
      <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> codebase</div>
      <div className="text-[0.8rem] text-subtle py-[0.15rem]">
        <span className={isStale ? 'text-amber' : ''}>{label}</span>
        {isStale ? (
          <button
            className="inline-block font-[inherit] text-[0.65rem] text-muted border border-dim bg-transparent px-2 py-[0.1rem] rounded-[3px] cursor-pointer ml-[0.5ch] transition-colors duration-150 whitespace-nowrap shrink-0 hover:text-green hover:border-green focus-visible:text-green focus-visible:border-green focus-visible:outline-1 focus-visible:outline-green focus-visible:outline-offset-1"
            aria-label="Update codebase map"
            onClick={() => copyToClipboard('/map-codebase', showToast)}
          >[update]</button>
        ) : null}
      </div>
    </section>
  );
});

function BacklogList({ data }) {
  const items = data.backlog || (data.todos?.pending) || [];
  const [expanded, setExpanded] = useState({});

  if (items.length === 0) {
    return (
      <section>
        <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> backlog</div>
        <div className="text-[0.8rem] text-dim py-[0.15rem] italic">none {'\u2014'} <span className="not-italic text-subtle">/fh:add-todo</span></div>
      </section>
    );
  }

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <section>
      <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> backlog <span>({items.length})</span></div>
      {items.map((t, i) => {
        const problem = extractProblemSection(t.body);
        const hasBody = problem || t.area;
        return (
          <div key={i}>
            <div
              className="flex items-center gap-[1ch] text-[0.8rem] py-[0.2rem] cursor-pointer focus-visible:outline-1 focus-visible:outline-dim focus-visible:outline-offset-1"
              onClick={hasBody ? () => toggle(i) : undefined}
              onKeyDown={hasBody ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } } : undefined}
              role={hasBody ? 'button' : undefined}
              tabIndex={hasBody ? '0' : undefined}
              aria-expanded={hasBody ? String(!!expanded[i]) : undefined}
            >
              <span className="text-amber w-[1.5ch] text-center shrink-0 text-xs">{'\u25CB'}</span>
              <span className="text-subtle flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{t.title}</span>
              {t.area && !problem ? <span className="text-[0.7rem] text-dim shrink-0">{t.area}</span> : null}
              {t.priority ? <span className="text-[0.7rem] text-dim shrink-0">{t.priority}</span> : null}
            </div>
            {expanded[i] && hasBody ? (
              <div className="text-xs text-dim py-[0.15rem] pb-[0.3rem] pl-10 whitespace-pre-wrap leading-[1.4]">{problem || t.area}</div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

function QuickTaskList({ data }) {
  const qts = data.quickTasks || [];
  const [expanded, setExpanded] = useState({});

  if (qts.length === 0) {
    return (
      <section>
        <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> quick_tasks</div>
        <div className="text-[0.8rem] text-dim py-[0.15rem] italic">none {'\u2014'} <span className="not-italic text-subtle">/fh:quick</span></div>
      </section>
    );
  }

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <section>
      <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> quick_tasks</div>
      {qts.map((q, i) => {
        const qd = q.status === 'complete';
        const firstPara = extractFirstParagraph(q.body);
        const hasBody = !!firstPara;
        return (
          <div key={i}>
            <div
              className="flex items-center gap-[1ch] text-[0.8rem] py-[0.2rem] cursor-pointer focus-visible:outline-1 focus-visible:outline-dim focus-visible:outline-offset-1"
              onClick={hasBody ? () => toggle(i) : undefined}
              onKeyDown={hasBody ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } } : undefined}
              role={hasBody ? 'button' : undefined}
              tabIndex={hasBody ? '0' : undefined}
              aria-expanded={hasBody ? String(!!expanded[i]) : undefined}
            >
              <span className={`w-[1.5ch] text-center shrink-0 text-xs ${qd ? 'text-green' : 'text-dim'}`}>{qd ? '\u2713' : '\u00B7'}</span>
              <span className="text-dim">#{ q.number}</span>
              <span className={`flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap ${qd ? 'text-muted' : 'text-subtle'}`}>{q.title}</span>
            </div>
            {expanded[i] && firstPara ? (
              <div className="text-xs text-dim py-[0.15rem] pb-[0.3rem] pl-10 whitespace-pre-wrap leading-[1.4]">{firstPara}</div>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}

const ActivityList = memo(function ActivityList({ data }) {
  const updates = data.recentActivity || data.activity || [];

  if (updates.length === 0) {
    return (
      <section>
        <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> activity</div>
        <div className="text-[0.8rem] text-dim py-[0.15rem] italic">no recent activity</div>
      </section>
    );
  }

  return (
    <section>
      <div className="text-[0.8rem] text-dim mb-[0.35rem]"><span className="text-muted">{'//'}</span> activity</div>
      {updates.slice(0, 6).map((u, i) => (
        <div className="flex gap-[1.5ch] text-[0.8rem] py-[0.12rem]" key={i}>
          <span className="text-dim [font-variant-numeric:tabular-nums] whitespace-nowrap min-w-[5.5ch]">{relativeTime(u.time || u.date)}</span>
          <span className="text-subtle">{u.text}</span>
        </div>
      ))}
    </section>
  );
});

export function Sidebar({ data, showToast }) {
  return (
    <div className="flex flex-col gap-5">
      <ConcernsPanel concerns={data.concerns} />
      <CodebaseFreshness data={data} showToast={showToast} />
      <BacklogList data={data} />
      <QuickTaskList data={data} />
      <ActivityList data={data} />
    </div>
  );
}

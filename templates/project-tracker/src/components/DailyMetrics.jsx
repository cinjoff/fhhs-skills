import { useState } from 'preact/hooks';

/**
 * DailyMetrics — "Refresh Stats" button + hero numbers + per-project breakdown.
 *
 * Fetches GET /api/metrics on button click. Displays:
 *   "Today: N commits · N files · N lines across N projects"
 * with a collapsible per-project table below.
 */
export function DailyMetrics() {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'ok' | 'error'
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function refresh() {
    setState('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
      setState('ok');
    } catch (err) {
      setErrorMsg(err.message || 'Unknown error');
      setState('error');
    }
  }

  const totals = data?.totals || { commits: 0, files: 0, lines: 0 };
  const projects = data?.projects || [];
  const projectCount = data?.projectCount ?? projects.length;

  return (
    <div className="pb-5 mb-5 border-b border-border">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="text-[0.75rem] text-dim">
          <span className="text-muted">{'//'}</span>{' '}
          <span className="text-subtle">daily_metrics</span>
        </div>
        <button
          onClick={refresh}
          disabled={state === 'loading'}
          className="text-[0.75rem] px-[1.2ch] py-[0.2em] border border-border rounded-[3px] text-muted hover:text-text hover:border-subtle transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-[inherit]"
        >
          {state === 'loading' ? (
            <>Fetching<span className="blink">_</span></>
          ) : (
            'Refresh Stats'
          )}
        </button>
      </div>

      {/* Hero numbers */}
      {state === 'idle' && (
        <p className="text-[0.8rem] text-dim">Click to load today&apos;s stats.</p>
      )}

      {state === 'loading' && (
        <p className="text-[0.8rem] text-dim">
          Loading<span className="blink">_</span>
        </p>
      )}

      {state === 'error' && (
        <p className="text-[0.8rem] text-fire">
          Error: {errorMsg}
        </p>
      )}

      {state === 'ok' && (
        <>
          <p className="text-[0.9rem] font-bold text-bright mb-3">
            Today:{' '}
            <span className="text-green">{totals.commits}</span>
            <span className="text-muted"> commits</span>
            {' · '}
            <span className="text-green">{totals.files}</span>
            <span className="text-muted"> files</span>
            {' · '}
            <span className="text-green">{totals.lines}</span>
            <span className="text-muted"> lines</span>
            {' across '}
            <span className="text-green">{projectCount}</span>
            <span className="text-muted"> {projectCount === 1 ? 'project' : 'projects'}</span>
          </p>

          {/* Per-project breakdown */}
          {projects.length > 0 && (
            <details>
              <summary className="cursor-pointer text-[0.75rem] text-dim flex items-center gap-2 mb-2">
                <span className="arrow inline-block transition-transform duration-150">▶</span>
                <span className="text-muted">per_project</span>
              </summary>
              <div className="mt-2 flex flex-col gap-[0.3rem]">
                {projects.map((p) => (
                  <div
                    key={p.path || p.name}
                    className="flex items-baseline gap-[2ch] text-[0.8rem]"
                  >
                    <span className="text-subtle font-medium min-w-[12ch] truncate" title={p.path}>
                      {p.name}
                    </span>
                    <span className="text-muted [font-variant-numeric:tabular-nums]">
                      <span className="text-text">{p.commits}</span> commits
                      {' · '}
                      <span className="text-text">{p.files}</span> files
                      {' · '}
                      <span className="text-text">{p.lines}</span> lines
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}

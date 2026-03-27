/**
 * TopBar — full-width fixed bar spanning the top of the viewport.
 *
 * Left zone: "N commits · N files · N lines · M repos today"  + Refresh Stats button
 * Right zone: AutoTicker (running auto jobs across all projects)
 *
 * Props:
 *   metrics          — /api/metrics response object (or null before first fetch)
 *   repoCount        — number of unique repos today (from metrics API, not worktree count)
 *   autoJobs         — array of { projectPath, projectName, repoName, autoState }
 *   onRefreshMetrics — called when Refresh Stats is clicked
 *   onSelectProject  — passed through to AutoTicker
 */

import { AutoTicker } from './AutoTicker.jsx';

export function TopBar({ metrics, repoCount, autoJobs, onRefreshMetrics, onSelectProject }) {
  const isLoading = metrics && metrics._loading;
  const hasData = metrics && !metrics._loading && !metrics._error && metrics.totals;
  const hasError = metrics && metrics._error;

  const totals = hasData ? (metrics.totals || { commits: 0, files: 0, lines: 0 }) : null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        height: '2.6rem',
        background: '#0d0d0d',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        gap: '1rem',
        fontFamily: 'inherit',
        fontSize: '0.75rem',
      }}
    >
      {/* Left zone: metrics summary + refresh button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1ch', flexShrink: 0 }}>
        {/* Metrics numbers */}
        {hasData && (
          <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
            <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{totals.commits}</span>
            <span style={{ color: 'var(--color-muted)' }}> commits</span>
            <span style={{ color: 'var(--color-dim)' }}> · </span>
            <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{totals.files}</span>
            <span style={{ color: 'var(--color-muted)' }}> files</span>
            <span style={{ color: 'var(--color-dim)' }}> · </span>
            <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{totals.lines}</span>
            <span style={{ color: 'var(--color-muted)' }}> lines</span>
            {repoCount != null && (
              <>
                <span style={{ color: 'var(--color-dim)' }}> · </span>
                <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{repoCount}</span>
                <span style={{ color: 'var(--color-muted)' }}> repos today</span>
              </>
            )}
          </span>
        )}

        {isLoading && (
          <span style={{ color: 'var(--color-dim)' }}>
            loading<span style={{ animation: 'bl 1s step-end infinite' }}>_</span>
          </span>
        )}

        {hasError && (
          <span style={{ color: 'var(--color-fire)', fontSize: '0.7rem' }}>
            stats error
          </span>
        )}

        {/* Refresh Stats button */}
        <button
          onClick={onRefreshMetrics}
          disabled={isLoading}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: '3px',
            padding: '0.1rem 0.7ch',
            color: isLoading ? 'var(--color-dim)' : 'var(--color-muted)',
            fontFamily: 'inherit',
            fontSize: '0.7rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'color 0.15s, border-color 0.15s',
            lineHeight: 1.5,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.color = 'var(--color-bright)';
              e.currentTarget.style.borderColor = 'var(--color-subtle)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isLoading ? 'var(--color-dim)' : 'var(--color-muted)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          {isLoading ? 'Fetching…' : 'Refresh Stats'}
        </button>
      </div>

      {/* Right zone: AutoTicker */}
      <div style={{ minWidth: 0, overflow: 'hidden' }}>
        <AutoTicker autoJobs={autoJobs} onSelectProject={onSelectProject} />
      </div>
    </div>
  );
}

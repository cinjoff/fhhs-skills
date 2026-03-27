import { useState, useEffect } from 'preact/hooks';

const PHASES = ['plan-work', 'plan-review', 'build', 'review'];

function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${rem}s`;
}

export function AutoPipeline({ autoState }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!autoState) return null;

  const {
    current_phase = '',
    current_step = '',
    phases_completed = 0,
    phases_total = 0,
    step_started_at = null,
    failed_steps = [],
  } = autoState;

  const stepElapsed = step_started_at ? now - new Date(step_started_at).getTime() : 0;
  const progressPct = phases_total > 0 ? Math.round((phases_completed / phases_total) * 100) : 0;

  // Determine step status for the phase pipeline display
  function getStepStatus(phase) {
    if (failed_steps && failed_steps.includes(phase)) return 'failed';
    const phaseIdx = PHASES.indexOf(phase);
    const currentIdx = PHASES.indexOf(current_phase);
    if (phaseIdx < currentIdx) return 'done';
    if (phaseIdx === currentIdx) return 'active';
    return 'pending';
  }

  const failedStep = failed_steps && failed_steps.length > 0 ? failed_steps[failed_steps.length - 1] : null;

  return (
    <div className="bg-surface border border-border rounded-[3px] p-4 mb-4">
      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-4 overflow-x-auto">
        {PHASES.map((phase, i) => {
          const status = getStepStatus(phase);
          return (
            <div key={phase} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-[0.7rem] font-bold border
                    ${status === 'done' ? 'bg-green border-green text-bg' : ''}
                    ${status === 'active' ? 'border-green text-green animate-[pulse_1.5s_ease-in-out_infinite]' : ''}
                    ${status === 'failed' ? 'bg-fire border-fire text-bg' : ''}
                    ${status === 'pending' ? 'border-dim text-muted' : ''}
                  `}
                  title={status === 'failed' && failedStep === phase ? `Failed: ${phase}` : undefined}
                >
                  {status === 'done' ? '✓' : status === 'failed' ? '✗' : i + 1}
                </div>
                <span className={`text-[0.65rem] whitespace-nowrap ${status === 'active' ? 'text-green' : status === 'done' ? 'text-subtle' : 'text-dim'}`}>
                  {phase}
                </span>
              </div>
              {i < PHASES.length - 1 && (
                <div className={`h-px w-8 mx-1 mb-5 ${PHASES.indexOf(current_phase) > i ? 'bg-green' : 'bg-border'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step info */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs">{'//'}</span>
          <span className="text-dim text-xs">step:</span>
          <span className="text-bright text-xs font-bold">{current_step || current_phase || '—'}</span>
          {stepElapsed > 0 && (
            <span className="text-muted text-xs">({formatElapsed(stepElapsed)})</span>
          )}
        </div>
        <span className="text-dim text-xs shrink-0">
          Phase {phases_completed} of {phases_total}
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-[3px] bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-green rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-muted text-[0.65rem]">progress</span>
        <span className="text-dim text-[0.65rem]">{progressPct}%</span>
      </div>
    </div>
  );
}

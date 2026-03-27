import { useMemo } from 'preact/hooks';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltipContent, chartConfig } from '../lib/chart-theme.js';

function formatDuration(ms) {
  if (!ms) return '0s';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${rem}s`;
}

function statusColor(status) {
  switch (status) {
    case 'success': return chartConfig.success.color;
    case 'failed': return chartConfig.failed.color;
    case 'active': return chartConfig.active.color;
    case 'skipped': return chartConfig.skipped.color;
    default: return chartConfig.skipped.color;
  }
}

function StepTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div style={{
      background: '#131313',
      border: `1px solid ${statusColor(d.status)}`,
      borderRadius: '3px',
      padding: '6px 10px',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: '0.72rem',
      color: '#cccccc',
      minWidth: '140px',
    }}>
      <div style={{ color: '#808080', marginBottom: '4px', borderBottom: '1px solid #222', paddingBottom: '3px' }}>
        {d.phase}: {d.step}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#808080' }}>duration</span>
        <span style={{ color: '#e8e8e8' }}>{formatDuration(d.elapsed_ms)}</span>
      </div>
      {d.cost != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ color: '#808080' }}>cost</span>
          <span style={{ color: chartConfig.cost.color }}>${Number(d.cost).toFixed(4)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#808080' }}>status</span>
        <span style={{ color: statusColor(d.status) }}>{d.status}</span>
      </div>
    </div>
  );
}

export function StepTimeline({ autoState }) {
  const stepHistory = autoState?.step_history || [];

  const chartData = useMemo(() => {
    return stepHistory.map((step, i) => ({
      label: `${step.phase || `P${Math.floor(i/2)+1}`}:${step.step || step.name || `s${i+1}`}`,
      phase: step.phase || `P${Math.floor(i/2)+1}`,
      step: step.step || step.name || `step${i+1}`,
      elapsed_ms: step.elapsed_ms || 0,
      cost: step.cost,
      status: step.status || 'success',
    }));
  }, [stepHistory]);

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '16px',
        textAlign: 'center',
        color: '#3a3a3a',
        fontSize: '0.75rem',
        fontFamily: 'inherit',
        border: '1px solid #222',
        borderRadius: '3px',
        background: '#131313',
      }}>
        No step history yet
      </div>
    );
  }

  const chartHeight = Math.max(120, chartData.length * 24 + 40);

  return (
    <div style={{ background: '#131313', border: '1px solid #222', borderRadius: '3px', padding: '12px' }}>
      <div style={{ fontSize: '0.7rem', color: '#808080', marginBottom: '8px', fontFamily: 'inherit' }}>
        <span style={{ color: '#3a3a3a' }}>{'//'}</span> step_timeline
      </div>

      <ChartContainer height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1b2332" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#3a3a3a', fontSize: 9, fontFamily: 'inherit' }}
            axisLine={{ stroke: '#222' }}
            tickLine={false}
            tickFormatter={(v) => formatDuration(v)}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#3a3a3a', fontSize: 9, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<StepTooltip />} />
          <Bar dataKey="elapsed_ms" radius={[0, 2, 2, 0]} maxBarSize={16}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={statusColor(entry.status)} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

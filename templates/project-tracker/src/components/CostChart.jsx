import { useMemo } from 'preact/hooks';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine,
  CartesianGrid, defs, linearGradient, stop,
} from 'recharts';
import { ChartContainer, ChartTooltipContent, chartConfig } from '../lib/chart-theme.js';

function formatDollar(v) {
  if (v === undefined || v === null) return '$0.000';
  return '$' + Number(v).toFixed(3);
}

export function CostChart({ autoState }) {
  const stepHistory = autoState?.step_history || [];
  const budget = autoState?.budget;
  const phasesLeft = (autoState?.phases_total || 0) - (autoState?.phases_completed || 0);

  const chartData = useMemo(() => {
    let cumulative = 0;
    return stepHistory.map((step, i) => {
      cumulative += step.cost || 0;
      const phase = step.phase || `P${Math.floor(i / 2) + 1}`;
      const stepName = step.step || step.name || `step${i + 1}`;
      return {
        label: `${phase}:${stepName}`,
        cost: parseFloat(cumulative.toFixed(4)),
        stepCost: step.cost || 0,
      };
    });
  }, [stepHistory]);

  const totalCost = chartData.length > 0 ? chartData[chartData.length - 1].cost : 0;
  const avgCostPerStep = chartData.length > 0 ? totalCost / chartData.length : 0;
  const estRemaining = phasesLeft > 0 && avgCostPerStep > 0
    ? avgCostPerStep * phasesLeft
    : 0;

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
        No cost data yet
      </div>
    );
  }

  return (
    <div style={{ background: '#131313', border: '1px solid #222', borderRadius: '3px', padding: '12px' }}>
      <div style={{ fontSize: '0.7rem', color: '#808080', marginBottom: '8px', fontFamily: 'inherit' }}>
        <span style={{ color: '#3a3a3a' }}>{'//'}</span> cost_over_time
      </div>

      <ChartContainer height={160}>
        <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1b2332" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: '#3a3a3a', fontSize: 9, fontFamily: 'inherit' }}
            axisLine={{ stroke: '#222' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#3a3a3a', fontSize: 9, fontFamily: 'inherit' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v.toFixed(2)}`}
            width={42}
          />
          <Tooltip
            content={<ChartTooltipContent
              formatter={(value, name) => [formatDollar(value), name === 'cost' ? 'cumulative' : name]}
            />}
          />
          {budget != null && (
            <ReferenceLine
              y={budget}
              stroke="hsl(0, 84%, 60%)"
              strokeDasharray="4 4"
              label={{
                value: `budget: ${formatDollar(budget)}`,
                fill: 'hsl(0, 84%, 60%)',
                fontSize: 9,
                fontFamily: 'inherit',
                position: 'insideTopRight',
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="cost"
            stroke={chartConfig.cost.color}
            strokeWidth={1.5}
            fill="url(#costGradient)"
            dot={false}
            activeDot={{ r: 3, fill: chartConfig.cost.color }}
          />
        </AreaChart>
      </ChartContainer>

      {/* Summary stats */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1px solid #222',
        fontFamily: 'inherit',
        fontSize: '0.7rem',
        flexWrap: 'wrap',
      }}>
        <div>
          <span style={{ color: '#808080' }}>total: </span>
          <span style={{ color: '#00ff41' }}>{formatDollar(totalCost)}</span>
        </div>
        <div>
          <span style={{ color: '#808080' }}>avg/step: </span>
          <span style={{ color: '#cccccc' }}>{formatDollar(avgCostPerStep)}</span>
        </div>
        {estRemaining > 0 && (
          <div>
            <span style={{ color: '#808080' }}>est. remaining: </span>
            <span style={{ color: '#ffb300' }}>{formatDollar(estRemaining)}</span>
          </div>
        )}
        {budget != null && (
          <div>
            <span style={{ color: '#808080' }}>budget: </span>
            <span style={{ color: totalCost > budget ? 'hsl(0,84%,60%)' : '#808080' }}>{formatDollar(budget)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

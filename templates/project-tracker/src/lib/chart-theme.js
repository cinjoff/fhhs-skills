import { h } from 'preact';
import { ResponsiveContainer } from 'recharts';

export const chartConfig = {
  cost: { label: "Cost ($)", color: "hsl(142, 71%, 45%)" },
  duration: { label: "Duration (s)", color: "hsl(47, 96%, 53%)" },
  budget: { label: "Budget", color: "hsl(0, 84%, 60%)" },
  success: { color: "hsl(142, 71%, 45%)" },
  failed: { color: "hsl(0, 84%, 60%)" },
  skipped: { color: "hsl(215, 14%, 34%)" },
  active: { color: "hsl(47, 96%, 53%)" },
};

// Build CSS variables object from config
function buildCSSVars(config) {
  const vars = {};
  for (const [key, val] of Object.entries(config)) {
    if (val.color) vars[`--chart-${key}`] = val.color;
  }
  return vars;
}

const MONO = "'JetBrains Mono', 'Courier New', monospace";

export function ChartContainer({ children, height, style }) {
  const cssVars = buildCSSVars(chartConfig);
  const h_ = height || 200;
  return h('div', { style: { ...cssVars, ...style, width: '100%', height: h_ } },
    h(ResponsiveContainer, { width: '100%', height: '100%' }, children)
  );
}

export function ChartTooltipContent({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;

  return h('div', {
    style: {
      background: '#131313',
      border: '1px solid var(--chart-cost, #00ff41)',
      borderRadius: '3px',
      padding: '6px 10px',
      fontFamily: MONO,
      fontSize: '0.75rem',
      color: '#cccccc',
      minWidth: '120px',
    }
  },
    label && h('div', {
      style: { color: '#808080', marginBottom: '4px', borderBottom: '1px solid #222', paddingBottom: '3px' }
    }, label),
    ...payload.map((entry, i) => {
      const val = formatter ? formatter(entry.value, entry.name) : entry.value;
      const displayVal = Array.isArray(val) ? val[0] : val;
      const displayName = Array.isArray(val) ? val[1] : (entry.name || '');
      return h('div', {
        key: i,
        style: { display: 'flex', justifyContent: 'space-between', gap: '12px' }
      },
        h('span', { style: { color: entry.color || '#808080' } }, displayName || entry.dataKey),
        h('span', { style: { color: '#e8e8e8' } }, displayVal)
      );
    })
  );
}

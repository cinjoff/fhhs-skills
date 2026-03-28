import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getCSSVar(name) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  } catch {
    return '';
  }
}

// ── CostChart ───────────────────────────────────────────────────────────────────

export function CostChart({ data, title }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [chartReady, setChartReady] = useState(typeof window !== 'undefined' && !!window.Chart);

  // Poll for Chart.js availability
  useEffect(() => {
    if (chartReady) return;
    const id = setInterval(() => {
      if (window.Chart) {
        setChartReady(true);
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [chartReady]);

  // Create / update chart
  useEffect(() => {
    if (!chartReady || !canvasRef.current || !data || data.length === 0) return;

    const Chart = window.Chart;
    const lineColor = getCSSVar('--color-status-active') || 'oklch(0.7 0.15 250)';
    const textColor = getCSSVar('--color-text-tertiary') || 'oklch(0.55 0.01 260)';
    const fontMono = getCSSVar('--font-family-mono') || '"JetBrains Mono", monospace';
    const gridColor = 'oklch(0.93 0.005 260 / 0.06)';

    // Parse lineColor into rgba for fill
    const fillColor = (() => {
      // Create a temp canvas to resolve the color
      const tmp = document.createElement('canvas');
      tmp.width = 1; tmp.height = 1;
      const ctx2 = tmp.getContext('2d');
      ctx2.fillStyle = lineColor;
      ctx2.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx2.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, 0.1)`;
    })();

    const labels = data.map(d => d.date);
    const costs = data.map(d => d.cost);
    const sessions = data.map(d => d.sessions);

    // Destroy previous instance
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Cost',
          data: costs,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointHoverBackgroundColor: lineColor,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'oklch(0.18 0.01 260)',
            titleColor: textColor,
            bodyColor: getCSSVar('--color-text-primary') || '#e0e0e0',
            borderColor: 'oklch(0.93 0.005 260 / 0.12)',
            borderWidth: 1,
            titleFont: { family: fontMono, size: 11 },
            bodyFont: { family: fontMono, size: 11 },
            padding: 8,
            displayColors: false,
            callbacks: {
              title: (items) => items[0]?.label || '',
              label: (item) => {
                const idx = item.dataIndex;
                const cost = costs[idx];
                const sess = sessions[idx];
                return `$${cost.toFixed(2)}  ·  ${sess} session${sess !== 1 ? 's' : ''}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor, drawBorder: false },
            ticks: {
              color: textColor,
              font: { family: fontMono, size: 10 },
              maxRotation: 0,
              maxTicksLimit: 6,
            },
            border: { display: false },
          },
          y: {
            grid: { color: gridColor, drawBorder: false },
            ticks: {
              color: textColor,
              font: { family: fontMono, size: 10 },
              callback: (v) => '$' + v.toFixed(2),
            },
            border: { display: false },
            beginAtZero: true,
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartReady, data]);

  // Don't render anything until Chart.js is available
  if (!chartReady) return null;
  if (!data || data.length === 0) return null;

  const displayTitle = title || 'Cost Over Time';

  return (
    <div style={{ padding: '0' }}>
      <div style={{
        fontSize: '11px',
        fontFamily: 'var(--font-family-sans)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--color-text-tertiary)',
        marginBottom: '8px',
      }}>{displayTitle}</div>
      <div style={{ height: '120px', position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}

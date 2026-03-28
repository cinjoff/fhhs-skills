import { useState, useEffect } from 'preact/hooks';
import { PortfolioSummary } from './PortfolioSummary.jsx';
import { ActivityFeed } from './ActivityFeed.jsx';
import { CostChart } from './CostChart.jsx';

/**
 * Portfolio overview shown when no project is selected.
 * Aggregates data across all projects.
 */
export function PortfolioView({ projects, activities, autoJobCount }) {
  // Aggregate cost data from all projects
  const [costData, setCostData] = useState([]);

  useEffect(() => {
    // Build cost timeline from activities
    const byDate = {};
    for (const a of (activities || [])) {
      if (!a.timestamp) continue;
      const date = new Date(a.timestamp).toLocaleDateString();
      if (!byDate[date]) byDate[date] = { date, cost: 0, sessions: 0 };
      if (a.cost) byDate[date].cost += a.cost;
      byDate[date].sessions++;
    }
    setCostData(Object.values(byDate).slice(-14)); // Last 14 days
  }, [activities]);

  return (
    <div style={{ padding: '16px 24px', animation: 'fadeIn 150ms ease-out' }}>
      <PortfolioSummary projects={projects} autoJobCount={autoJobCount} />

      <div style={{ marginTop: '24px', display: 'grid', gap: '24px' }}>
        {costData.length > 0 && (
          <CostChart data={costData} title="Cost Over Time" />
        )}

        <ActivityFeed activities={activities} showProject={true} />
      </div>
    </div>
  );
}

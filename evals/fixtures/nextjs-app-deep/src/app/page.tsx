'use client';

import { useEffect, useState } from 'react';
import { MetricCard } from '@/components/metric-card';
import { DataTable } from '@/components/data-table';
import { ChartWidget } from '@/components/chart-widget';
import { Sidebar } from '@/components/sidebar';

interface DashboardData {
  metrics: Array<{ id: string; label: string; value: number; change: number }>;
  users: Array<Record<string, unknown>>;
  activity: Array<{ label: string; value: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const metricsRes = await fetch('/api/data?table=metrics');
        const metrics = await metricsRes.json();

        const usersRes = await fetch('/api/users?limit=5');
        const users = await usersRes.json();

        const activityRes = await fetch('/api/data?table=activity');
        const activity = await activityRes.json();

        setData({ metrics: metrics.data, users: users.data, activity: activity.data });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {data?.metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              label={metric.label}
              value={metric.value}
              change={metric.change}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartWidget title="User Activity" data={data?.activity || []} />
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Users</h2>
            <DataTable
              data={data?.users || []}
              fields={[
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'role', label: 'Role' },
                { key: 'lastActive', label: 'Last Active' },
              ]}
              pageSize={5}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

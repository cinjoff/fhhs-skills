import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, change, icon }: MetricCardProps) {
  const isPositive = change && change > 0;

  return (
    <Card className="relative overflow-hidden backdrop-blur-xl bg-white/10 border border-white/20">
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute -right-4 -top-4 w-24 h-24 text-blue-500/10"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
        <svg
          className="absolute -left-6 -bottom-6 w-32 h-32 text-purple-500/10"
          viewBox="0 0 100 100"
          fill="currentColor"
        >
          <circle cx="50" cy="50" r="50" />
        </svg>
      </div>
      <CardContent className="pt-6 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="text-5xl font-black bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          {value}
        </div>
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <span
              className={`text-sm font-medium ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

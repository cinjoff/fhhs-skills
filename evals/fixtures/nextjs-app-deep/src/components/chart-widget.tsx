'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartData {
  label: string;
  value: number;
}

interface ChartWidgetProps {
  title: string;
  data: ChartData[];
}

export function ChartWidget({ title, data }: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const maxValue = Math.max(...data.map((d) => d.value));

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const elements = containerRef.current.querySelectorAll('.chart-bar');
        elements.forEach((el) => {
          const width = (el as HTMLElement).offsetWidth;
          setContainerWidth(width);
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="chart-bar h-full rounded-full bg-blue-500"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    transition: 'width 0.5s ease-in-out, height 0.3s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

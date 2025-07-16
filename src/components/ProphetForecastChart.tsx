import React from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, Scatter } from 'recharts';

interface ProphetForecastDatum {
  date: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
  actual?: number;
}

interface ProphetForecastChartProps {
  data: ProphetForecastDatum[];
}

const ProphetForecastChart: React.FC<ProphetForecastChartProps> = ({ data }) => {
  const hasData = data && data.length > 0;
  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-medium animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Footfall Forecast for Next 7 Days</h3>
        <div className="h-1 w-12 bg-gradient-primary rounded-full"></div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip />
            {/* Confidence interval as shaded area (note: true lower bound shading not natively supported in recharts Area) */}
            <Area type="monotone" dataKey="yhat_upper" fill="#60a5fa" fillOpacity={0.2} />
            <Line type="monotone" dataKey="yhat" stroke="#2563eb" strokeWidth={2} dot={false} name="Forecast" />
            <Scatter data={data.filter(d => d.actual !== undefined)} fill="#000" name="Actual" line={false} shape="circle" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          No forecast data available.
        </div>
      )}
    </Card>
  );
};

export default ProphetForecastChart; 
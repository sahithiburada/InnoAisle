import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ZoneChartData {
  zone: string;
  footfall: number;
  energyConsumption: number;
}

interface TrafficChartProps {
  type: 'forecast' | 'realtime' | 'zones';
  title: string;
  data?: ZoneChartData[];
}

const TrafficChart: React.FC<TrafficChartProps> = ({ type, title, data = [] }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-medium border">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey.includes('energy') ? ' units' : ' visitors'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'zones':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="zone" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="footfall" 
                fill="hsl(var(--primary))" 
                name="Visitor Count"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="energyConsumption" 
                fill="hsl(var(--accent))" 
                name="Energy Demand"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      // For forecast and realtime, you can extend this to use real backend data as needed
      default:
        return (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No data available.
          </div>
        );
    }
  };

  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-medium animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <div className="h-1 w-12 bg-gradient-primary rounded-full"></div>
      </div>
      {renderChart()}
      <div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
        {type === 'zones' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Visitor Count</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent rounded-full"></div>
              <span>Energy Demand</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default TrafficChart;
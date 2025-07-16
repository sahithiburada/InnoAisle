import React from 'react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface EnergyConsumptionDatum {
  zone: string;
  energyConsumption: number;
}

interface EnergyConsumptionChartProps {
  data: EnergyConsumptionDatum[];
}

const EnergyConsumptionChart: React.FC<EnergyConsumptionChartProps> = ({ data }) => {
  const hasData = data && data.length > 0;
  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-medium animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Energy Consumption by Zone</h3>
        <div className="h-1 w-12 bg-gradient-primary rounded-full"></div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="zone" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip />
            <Bar dataKey="energyConsumption" fill="#38bdf8" name="Energy Consumption" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          No energy consumption data available.
        </div>
      )}
    </Card>
  );
};

export default EnergyConsumptionChart; 
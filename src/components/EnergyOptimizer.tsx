import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, TrendingDown, Database } from 'lucide-react';

export interface LayoutSuggestion {
  zone: string;
  predicted_footfall?: number;
  heat_zone_probability?: number;
  cooling_energy?: number;
  high_traffic_times?: number[];
  shiftable_products?: string[];
  cooling_cycle?: {
    start_hour?: number;
    end_hour?: number;
    temp_threshold?: number;
    increase?: number;
    base?: number;
  };
  message?: string;
}

export interface RearrangementSuggestion {
  from_zone: string;
  to_zone: string;
  current_traffic: number;
  target_traffic: number;
  new_target_traffic: number;
  penalty: number;
  product: string;
  type: string;
}

interface EnergyOptimizerProps {
  layoutSuggestions: LayoutSuggestion[];
  rearrangementSuggestions: RearrangementSuggestion[];
}

const EnergyOptimizer: React.FC<EnergyOptimizerProps> = ({ layoutSuggestions, rearrangementSuggestions }) => {
  const hasLayout = layoutSuggestions && layoutSuggestions.length > 0 && !layoutSuggestions[0].message;
  const hasRearrangement = rearrangementSuggestions && rearrangementSuggestions.length > 0;

  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-medium animate-slide-up">
      <h3 className="text-lg font-semibold text-foreground mb-6">AI Energy Optimizer</h3>
      <div className="space-y-4">
        {hasLayout && layoutSuggestions.map((s, idx) => (
          <div key={idx} className="p-4 rounded-lg border bg-card/50 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="h-4 w-4 text-info" />
              <span className="font-medium">Zone {s.zone}</span>
              {typeof s.heat_zone_probability === 'number' && (
                <Badge className="ml-2 bg-warning/10 text-warning border-warning/20">
                  Heat Zone Probability: {(s.heat_zone_probability * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
            {typeof s.predicted_footfall === 'number' && (
              <div className="text-sm text-muted-foreground mb-1">Predicted Footfall: {s.predicted_footfall.toFixed(1)}</div>
            )}
            {typeof s.cooling_energy === 'number' && (
              <div className="text-sm text-muted-foreground mb-1">Cooling Energy: {s.cooling_energy.toFixed(1)}</div>
            )}
            {s.high_traffic_times && s.high_traffic_times.length > 0 && (
              <div className="text-sm text-muted-foreground mb-1">High Traffic Hours: {s.high_traffic_times.join(', ')}</div>
            )}
            {s.shiftable_products && s.shiftable_products.length > 0 && (
              <div className="text-xs text-muted-foreground mb-1">Shiftable Products: {s.shiftable_products.join(', ')}</div>
            )}
            {s.cooling_cycle && (
              <div className="text-xs text-muted-foreground mb-1">
                Cooling Cycle: Increase by {s.cooling_cycle.increase}x from {s.cooling_cycle.start_hour}:00 to {s.cooling_cycle.end_hour}:00 if temp &gt; {s.cooling_cycle.temp_threshold?.toFixed(1)}°C
              </div>
            )}
              </div>
        ))}
        {hasRearrangement && rearrangementSuggestions.map((s, idx) => (
          <div key={idx} className="p-4 rounded-lg border bg-card/50 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="font-medium">Move {s.product} from Zone {s.from_zone} to Zone {s.to_zone}</span>
              <Badge className="ml-2 bg-info/10 text-info border-info/20">Penalty: {s.penalty}</Badge>
              </div>
            <div className="text-xs text-muted-foreground mb-1">
              Current Traffic: {s.current_traffic.toFixed(1)}, Target Traffic: {s.target_traffic.toFixed(1)}, New Target: {s.new_target_traffic.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mb-1">Type: {s.type}</div>
          </div>
        ))}
        {!hasLayout && !hasRearrangement && (
          <div className="flex flex-col items-center justify-center py-8">
            <Database className="h-10 w-10 text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">No optimizations available from backend.</div>
      </div>
        )}
        {/* Show backend message if present */}
        {!hasLayout && layoutSuggestions && layoutSuggestions[0]?.message && (
          <div className="flex flex-col items-center justify-center py-4">
            <Database className="h-8 w-8 text-muted-foreground mb-2" />
            <div className="text-xs text-muted-foreground">{layoutSuggestions[0].message}</div>
        </div>
        )}
      </div>
    </Card>
  );
};

export default EnergyOptimizer;
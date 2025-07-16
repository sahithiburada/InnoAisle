import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface ZoneData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  footfall: number;
  temperature: number;
  products: string[];
  isRefrigeration: boolean;
}

interface StoreBluerintProps {
  showHeatMap?: boolean;
  showRearrangement?: boolean;
}

const StoreBlueprint: React.FC<StoreBluerintProps> = ({ 
  showHeatMap = true, 
  showRearrangement = false 
}) => {
  const [animatedZones, setAnimatedZones] = useState<string[]>([]);
  const [zones] = useState<ZoneData[]>([
    { id: 'Z1', name: 'Dairy & Frozen', x: 50, y: 100, width: 120, height: 80, footfall: 75, temperature: 2, products: ['Dairy', 'Frozen'], isRefrigeration: true },
    { id: 'Z2', name: 'Fresh Produce', x: 200, y: 100, width: 120, height: 80, footfall: 85, temperature: 4, products: ['Vegetables', 'Fruits'], isRefrigeration: true },
    { id: 'Z3', name: 'Beverages', x: 350, y: 100, width: 100, height: 80, footfall: 45, temperature: 22, products: ['Drinks', 'Water'], isRefrigeration: false },
    { id: 'Z4', name: 'Electronics', x: 480, y: 100, width: 120, height: 80, footfall: 95, temperature: 26, products: ['Electronics'], isRefrigeration: false },
    { id: 'Z5', name: 'Clothing', x: 50, y: 220, width: 150, height: 80, footfall: 35, temperature: 24, products: ['Apparel'], isRefrigeration: false },
    { id: 'Z6', name: 'Pharmacy', x: 230, y: 220, width: 100, height: 80, footfall: 55, temperature: 23, products: ['Medicine'], isRefrigeration: false },
    { id: 'Z7', name: 'Grocery', x: 360, y: 220, width: 120, height: 80, footfall: 65, temperature: 25, products: ['Food'], isRefrigeration: false },
    { id: 'Z8', name: 'Customer Service', x: 510, y: 220, width: 90, height: 80, footfall: 25, temperature: 22, products: ['Services'], isRefrigeration: false },
  ]);

  const getHeatColor = (footfall: number): string => {
    if (footfall > 80) return 'hsl(0 85% 60%)'; // Hot red
    if (footfall > 60) return 'hsl(25 85% 55%)'; // Orange
    if (footfall > 40) return 'hsl(45 85% 50%)'; // Yellow
    return 'hsl(145 60% 45%)'; // Cool green
  };

  const getHeatIntensity = (footfall: number): number => {
    return Math.min(footfall / 100, 1);
  };

  useEffect(() => {
    if (showRearrangement) {
      // Simulate rearrangement animation
      const timer = setTimeout(() => {
        setAnimatedZones(['Z4', 'Z1']); // Highlight zones being rearranged
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showRearrangement]);

  return (
    <Card className="p-6 bg-gradient-card border-0 shadow-medium">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground mb-2">Store Layout Blueprint</h3>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-yellow-500"></div>
            <span>Low Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-red-500"></div>
            <span>High Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-info bg-info/20"></div>
            <span>Refrigeration Zone</span>
          </div>
        </div>
      </div>
      
      <div className="relative bg-secondary/30 rounded-lg p-4 min-h-[400px] overflow-hidden">
        {/* Store perimeter */}
        <div className="absolute inset-4 border-2 border-border rounded-lg bg-background/50"></div>
        
        {/* Entrance */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-accent rounded-t-lg">
          <div className="text-xs text-center text-accent-foreground font-medium pt-1">Entrance</div>
        </div>
        
        {/* Zones */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 650 350">
          {zones.map((zone) => {
            const isAnimated = animatedZones.includes(zone.id);
            const heatColor = showHeatMap ? getHeatColor(zone.footfall) : 'hsl(var(--card))';
            const opacity = showHeatMap ? getHeatIntensity(zone.footfall) * 0.8 + 0.2 : 0.8;
            
            return (
              <g key={zone.id}>
                {/* Zone background with heat visualization */}
                <rect
                  x={zone.x}
                  y={zone.y}
                  width={zone.width}
                  height={zone.height}
                  fill={heatColor}
                  fillOpacity={opacity}
                  stroke={zone.isRefrigeration ? 'hsl(var(--info))' : 'hsl(var(--border))'}
                  strokeWidth={zone.isRefrigeration ? 3 : 1}
                  strokeDasharray={zone.isRefrigeration ? '5,5' : 'none'}
                  rx="8"
                  className={`transition-all duration-500 ${isAnimated ? 'animate-pulse-glow' : ''}`}
                />
                
                {/* Zone label */}
                <text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2 - 10}
                  textAnchor="middle"
                  className="fill-foreground text-sm font-medium"
                  style={{ fontSize: '12px' }}
                >
                  {zone.name}
                </text>
                
                {/* Footfall indicator */}
                {showHeatMap && (
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 + 8}
                    textAnchor="middle"
                    className="fill-foreground text-xs font-bold"
                    style={{ fontSize: '10px' }}
                  >
                    {zone.footfall} visitors
                  </text>
                )}
                
                {/* Temperature indicator for refrigeration zones */}
                {zone.isRefrigeration && (
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 + 20}
                    textAnchor="middle"
                    className="fill-info text-xs font-medium"
                    style={{ fontSize: '9px' }}
                  >
                    {zone.temperature}°C
                  </text>
                )}
                
                {/* Rearrangement arrows */}
                {isAnimated && showRearrangement && (
                  <g className="animate-float">
                    <path
                      d={`M ${zone.x + zone.width + 10} ${zone.y + zone.height / 2} Q ${zone.x + zone.width + 30} ${zone.y + zone.height / 2 - 20} ${zone.x + zone.width + 50} ${zone.y + zone.height / 2}`}
                      stroke="hsl(var(--accent))"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--accent))"
              />
            </marker>
          </defs>
        </svg>
        
        {/* Real-time data overlay */}
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-soft">
          <div className="text-xs text-muted-foreground mb-1">Real-time Status</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse-glow"></div>
            <span className="text-sm font-medium">Live Data Active</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default StoreBlueprint;
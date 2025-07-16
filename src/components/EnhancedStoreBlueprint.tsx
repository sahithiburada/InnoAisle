import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Thermometer, Users, Zap, AlertCircle } from 'lucide-react';
import { ZoneData } from '@/hooks/useRealTimeData';

interface LayoutMove {
  zone_id: string;
  to_key: string;
  details?: Record<string, any>; // Add this line
}

interface EnhancedStoreBlueprintProps {
  zones: ZoneData[];
  onZoneClick?: (zone: ZoneData) => void;
  aiSuggestions?: Record<string, string>; // zone_id -> suggestion
  layoutMoves?: LayoutMove[];
  showHeatMap?: boolean;
  heatMetric?: 'footfall' | 'temperature' | 'energyConsumption';
}

const BASE_WIDTH = 540;
const BASE_HEIGHT = 380;

// Classic schematic layout with department names as keys
const storeMapLayout: Record<string, { x: number; y: number; width: number; height: number; color: string; label: string; icon?: React.ReactNode }> = {
  'produce':    { x: 20,  y: 70,  width: 180, height: 90,  color: '#4b6eaf', label: 'Produce' },
  'bakery':     { x: 210, y: 70,  width: 180, height: 90,  color: '#6b8fcf', label: 'Bakery' },
  'dairy':      { x: 400, y: 70,  width: 120, height: 90,  color: '#b2c7e6', label: 'Dairy', icon: <AlertCircle className="text-red-500 w-8 h-8 absolute -right-6 -top-6" /> },
  'price':      { x: 20,  y: 170, width: 180, height: 110, color: '#4b6eaf', label: 'Price' },
  'grocery':    { x: 210, y: 170, width: 180, height: 110, color: '#3b4e6d', label: 'Grocery' },
  'grocery2':   { x: 400, y: 170, width: 60,  height: 110, color: '#3b4e6d', label: 'Grocery 2' },
  'pharmacy':   { x: 470, y: 170, width: 50,  height: 110, color: '#6b8fcf', label: 'Pharmacy' },
  'electronics':{ x: 20,  y: 290, width: 120, height: 80,  color: '#4b6eaf', label: 'Electronics' },
  'hroom':      { x: 150, y: 290, width: 160, height: 80,  color: '#6b8fcf', label: 'Hroom' },
  'home':       { x: 320, y: 290, width: 200, height: 80,  color: '#b2c7e6', label: 'Home' },
};

function getHeatColor(value: number, min = 0, max = 100) {
  const v = Math.max(min, Math.min(max, value));
  const r = Math.round(255);
  const g = Math.round(220 - (v / max) * 180);
  const b = Math.round(40 - (v / max) * 20);
  return `rgb(${r},${g},${b})`;
}

const EnhancedStoreBlueprint: React.FC<EnhancedStoreBlueprintProps> = ({ 
  zones,
  onZoneClick,
  aiSuggestions = {},
  layoutMoves = [],
  showHeatMap = true,
  heatMetric = 'footfall',
}) => {
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Map zones to schematic layout (ignore zones not in layout)
  const mappedZones = Object.entries(storeMapLayout).map(([key, layout]) => {
    // Find all zones with a matching product_category (case-insensitive)
    const matchingZones = zones.filter(z => (z.product_category || '').toLowerCase() === key);
    // Use the first matching zone for metrics, but aggregate all categories for modal
    const zone = matchingZones[0] || {};
    return { ...layout, ...zone, id: key, matchingZones };
  });

  // For each department, collect all unique product categories ever assigned to it
  const deptCategories: Record<string, Set<string>> = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    Object.keys(storeMapLayout).forEach(dept => {
      map[dept] = new Set();
    });
    zones.forEach(z => {
      const cat = (z.product_category || '').toLowerCase();
      if (map[cat]) map[cat].add(z.product_category);
    });
    return map;
  }, [zones]);

  // Highlight source and target blocks
  const involvedZones = useMemo(() => {
    const set = new Set<string>();
    layoutMoves.forEach(move => {
      set.add(move.zone_id);
      set.add(move.to_key);
    });
    return set;
  }, [layoutMoves]);

  // Map zone id to rearrangement details for modal
  const rearrangeDetails: Record<string, any> = useMemo(() => {
    const map: Record<string, any> = {};
    layoutMoves.forEach(move => {
      map[move.zone_id] = move.details || move;
      map[move.to_key] = move.details || move;
    });
    return map;
  }, [layoutMoves]);

  useEffect(() => {
    const basePositions: Record<string, { x: number; y: number }> = {};
    Object.entries(storeMapLayout).forEach(([key, layout]) => {
      basePositions[key] = { x: layout.x, y: layout.y };
    });
    if (layoutMoves && layoutMoves.length > 0) {
      layoutMoves.forEach(move => {
        if (basePositions[move.to_key]) {
          basePositions[move.zone_id] = { ...basePositions[move.to_key] };
        }
      });
    }
    setPositions(basePositions);
  }, [layoutMoves]);

  // Modal for department: show all product categories ever assigned to this department
  const ZoneModal = selectedZone && (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-xl font-bold mb-2 flex items-center gap-2">
          {storeMapLayout[selectedZone.id]?.label || selectedZone.id}
        </DialogTitle>
        <div className="mb-2 text-gray-700">
          {deptCategories[selectedZone.id] && deptCategories[selectedZone.id].size > 0 && (
            <div className="mb-2">
              <span className="font-semibold">Product Categories:</span>
              <ul className="list-disc ml-6">
                {[...deptCategories[selectedZone.id]].map((cat, i) => <li key={i}>{cat}</li>)}
              </ul>
            </div>
          )}
          {selectedZone.matchingZones && selectedZone.matchingZones[0]?.products && Array.isArray(selectedZone.matchingZones[0].products) && (
            <div className="mb-2">
              <span className="font-semibold">Products:</span>
              <ul className="list-disc ml-6">
                {selectedZone.matchingZones[0].products.map((p: string, i: number) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-4 mb-2">
            {selectedZone.footfall !== undefined && <span className="flex items-center"><Users className="w-4 h-4 mr-1" /> Footfall: {selectedZone.footfall}</span>}
            {selectedZone.energyConsumption !== undefined && <span className="flex items-center"><Zap className="w-4 h-4 mr-1" /> Energy: {selectedZone.energyConsumption}W</span>}
            {selectedZone.temperature !== undefined && <span className="flex items-center"><Thermometer className="w-4 h-4 mr-1" /> Temp: {selectedZone.temperature}°C</span>}
            </div>
          <div className="mb-2">
            <span className="font-semibold">AI Suggestion:</span><br />
            <span className="text-indigo-700">{aiSuggestions[selectedZone.id] || 'No suggestion for this zone.'}</span>
          </div>
          {rearrangeDetails[selectedZone.id] && (
            <div className="mb-2">
              <span className="font-semibold">Rearrangement:</span>
              <ul className="list-disc ml-6">
                {Object.entries(rearrangeDetails[selectedZone.id]).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-semibold">
                      {k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}:
                    </span> {String(v)}
                  </li>
                ))}
              </ul>
        </div>
          )}
        </div>
        <DialogClose asChild>
          <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Close</button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );

  const aisles = [
    <div key="aisle-v1" className="absolute bg-gray-200 rounded" style={{ left: `${200/BASE_WIDTH*100}%`, top: `${60/BASE_HEIGHT*100}%`, width: `${2/BASE_WIDTH*100}%`, height: `${320/BASE_HEIGHT*100}%` }} />,
    <div key="aisle-v2" className="absolute bg-gray-200 rounded" style={{ left: `${390/BASE_WIDTH*100}%`, top: `${60/BASE_HEIGHT*100}%`, width: `${2/BASE_WIDTH*100}%`, height: `${320/BASE_HEIGHT*100}%` }} />,
    <div key="aisle-h1" className="absolute bg-gray-200 rounded" style={{ left: `${20/BASE_WIDTH*100}%`, top: `${160/BASE_HEIGHT*100}%`, width: `${500/BASE_WIDTH*100}%`, height: `${2/BASE_HEIGHT*100}%` }} />,
    <div key="aisle-h2" className="absolute bg-gray-200 rounded" style={{ left: `${20/BASE_WIDTH*100}%`, top: `${280/BASE_HEIGHT*100}%`, width: `${500/BASE_WIDTH*100}%`, height: `${2/BASE_HEIGHT*100}%` }} />,
  ];

  // Rearrangement arrows
  const rearrangeArrows = layoutMoves && layoutMoves.length > 0 ? layoutMoves.map(move => {
    const from = storeMapLayout[move.zone_id] || storeMapLayout[move.to_key];
    const to = storeMapLayout[move.to_key];
    if (!from || !to) return null;
    const x1 = (from.x + from.width/2) / BASE_WIDTH * 100;
    const y1 = (from.y + from.height/2) / BASE_HEIGHT * 100;
    const x2 = (to.x + to.width/2) / BASE_WIDTH * 100;
    const y2 = (to.y + to.height/2) / BASE_HEIGHT * 100;
    return (
      <svg key={move.zone_id} className="absolute pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%' }}>
            <defs>
          <marker id={`arrowhead-${move.zone_id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
          </marker>
            </defs>
        <line
          x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
          stroke="#6366f1" strokeWidth={4} markerEnd={`url(#arrowhead-${move.zone_id})`} strokeDasharray="5,5" />
          </svg>
    );
  }) : null;
            
            return (
    <Card className="p-4 bg-[#f7f8fa] border-0 shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center justify-center">
      <div className="relative w-full aspect-[27/19] max-w-2xl mx-auto bg-[#f3f4f6] rounded-xl border border-gray-200 overflow-hidden">
        <div className="absolute left-1/2 -translate-x-1/2 top-2 text-2xl md:text-3xl font-extrabold tracking-widest text-[#2a4365]">WALMART</div>
        {aisles}
        {rearrangeArrows}
        {mappedZones.map(zone => {
          const pos = positions[zone.id] || { x: zone.x, y: zone.y };
          let blockColor = zone.color;
          if (showHeatMap && zone[heatMetric] !== undefined && zone[heatMetric] !== null) {
            blockColor = getHeatColor(Number(zone[heatMetric]));
          }
          // Highlight if involved in a move
          const isInvolved = involvedZones.has(zone.id);
          return (
            <div
              key={zone.id}
              className={`absolute flex flex-col items-center justify-center border-2 border-white shadow-md rounded-md transition-all duration-700 cursor-pointer hover:ring-4 hover:ring-blue-200 ${isInvolved ? 'ring-4 ring-indigo-400 z-10' : ''}`}
              style={{
                left: `${pos.x/BASE_WIDTH*100}%`,
                top: `${pos.y/BASE_HEIGHT*100}%`,
                width: `${zone.width/BASE_WIDTH*100}%`,
                height: `${zone.height/BASE_HEIGHT*100}%`,
                background: blockColor,
                zIndex: zone.id === 'dairy' ? 2 : 1,
                position: 'absolute',
                overflow: 'hidden',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => {
                setSelectedZone(zone);
                setModalOpen(true);
                onZoneClick?.(zone as any);
              }}
            >
              <span className="text-white text-base md:text-lg font-bold tracking-wide relative text-center w-full break-words leading-tight" style={{whiteSpace: 'normal', wordBreak: 'break-word'}}>
                {zone.label}
                {zone.icon}
              </span>
            </div>
          );
        })}
      </div>
      {ZoneModal}
    </Card>
  );
};

export default EnhancedStoreBlueprint;
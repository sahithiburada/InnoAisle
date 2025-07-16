import { useState, useCallback } from 'react';
import { DataProcessor, ProcessedZoneData, ProcessedMetrics, MLInsights } from '@/lib/dataProcessor';
import { LayoutSuggestion, RearrangementSuggestion } from '@/components/EnergyOptimizer';

interface HeatZoneSummary {
  zone: string;
  heat_zone_probability: number;
}

interface CoolingSummary {
  zone: string;
  cooling_energy: number;
}

export interface ZoneData {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  footfall: number;
  temperature: number;
  heatProduction: number;
  products: string[];
  isRefrigeration: boolean;
  energyConsumption: number;
  lastUpdated: Date;
  trafficScore?: number;
  heatZoneProbability?: number;
  coolingEnergy?: number;
  proximityPenalty?: number;
  color?: string;
  product_category?: string;
}

export interface StoreMetrics {
  currentVisitors: number;
  energyReduction: number;
  activeCooling: number;
  predictedPeak: number;
  totalEnergyConsumption: number;
  averageTemperature: number;
}

export interface DataIntegrationOptions {
  dataSource?: 'api' | 'file' | 'simulation';
}

interface UseRealTimeDataReturn {
  zones: ZoneData[];
  metrics: StoreMetrics | null;
  updateZoneData: (zoneId: string, data: Partial<ZoneData>) => void;
  updateMetrics: (data: Partial<StoreMetrics>) => void;
  importDataset: (dataset: any) => void;
  importCSVFile: (file: File) => Promise<void>;
  isConnected: boolean;
  lastUpdate: Date | null;
  mlInsights: MLInsights | null;
  dataProcessor: DataProcessor | null;
  isLoading: boolean;
  layoutSuggestions: LayoutSuggestion[];
  rearrangementSuggestions: RearrangementSuggestion[];
  heatZoneSummary: HeatZoneSummary[];
  coolingSummary: CoolingSummary[];
  prophetForecast: any[];
  zoneTrafficForecast: any[];
  simulatedEnergyUsage: number | undefined;
  detailedZoneSuggestions: any[];
  suggestedLayout: any;
  layoutMoves: any[];
}

export const useRealTimeData = (options: DataIntegrationOptions = {}): UseRealTimeDataReturn => {
  const {
    dataSource = 'file',
  } = options;

  const [dataProcessor] = useState(() => new DataProcessor());
  const [mlInsights, setMLInsights] = useState<MLInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start with empty zones and metrics
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [metrics, setMetrics] = useState<StoreMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [layoutSuggestions, setLayoutSuggestions] = useState<LayoutSuggestion[]>([]);
  const [rearrangementSuggestions, setRearrangementSuggestions] = useState<RearrangementSuggestion[]>([]);
  const [heatZoneSummary, setHeatZoneSummary] = useState<HeatZoneSummary[]>([]);
  const [coolingSummary, setCoolingSummary] = useState<CoolingSummary[]>([]);
  const [prophetForecast, setProphetForecast] = useState<any[]>([]);
  const [zoneTrafficForecast, setZoneTrafficForecast] = useState<any[]>([]);
  const [simulatedEnergyUsage, setSimulatedEnergyUsage] = useState<number | undefined>(undefined);
  const [detailedZoneSuggestions, setDetailedZoneSuggestions] = useState<any[]>([]);
  const [suggestedLayout, setSuggestedLayout] = useState<any>({});
  const [layoutMoves, setLayoutMoves] = useState<any[]>([]);


  const updateZoneData = useCallback((zoneId: string, data: Partial<ZoneData>) => {
    setZones(prev => prev.map(zone => 
      zone.id === zoneId 
        ? { ...zone, ...data, lastUpdated: new Date() }
        : zone
    ));
    setLastUpdate(new Date());
  }, []);

  const updateMetrics = useCallback((data: Partial<StoreMetrics>) => {
    setMetrics(prev => prev ? { ...prev, ...data } : null);
    setLastUpdate(new Date());
  }, []);

  const importDataset = useCallback((dataset: any) => {
    try {
      if (dataset.zones && Array.isArray(dataset.zones)) {
        setZones(dataset.zones.map((zone: any) => ({
          ...zone,
          lastUpdated: new Date()
        })));
      }
      if (dataset.metrics) {
        setMetrics(dataset.metrics);
      }
      if (dataset.insights) {
        setMLInsights(dataset.insights);
      }
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to import dataset:', error);
      setIsConnected(false);
    }
  }, []);

  const importCSVFile = useCallback(async (file: File) => {
    try {
      setIsLoading(true);
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      // Send to Flask backend at /predict endpoint
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      // Convert backend ML results to frontend format
      const blueprintLayout = result.blueprint_layout || {};
      const convertedZones: ZoneData[] = result.zone_summary.map((zone: any) => {
        const layout = blueprintLayout[zone.zone] || {};
        const heatZone = result.heat_zone_summary.find((h: any) => h.zone === zone.zone);
        const coolingZone = result.cooling_summary.find((c: any) => c.zone === zone.zone);
        return {
          id: zone.zone,
          name: layout.name || zone.zone,
          x: layout.x || 0,
          y: layout.y || 0,
          width: layout.width || 100,
          height: layout.height || 80,
          footfall: Math.round(zone.predicted_footfall),
          temperature: 24, // Default temperature
          heatProduction: Math.round(zone.predicted_footfall * 15),
          products: [],
          isRefrigeration: layout.isRefrigeration || false,
          energyConsumption: Math.round(coolingZone?.cooling_energy || 100),
          lastUpdated: new Date(),
          trafficScore: zone.predicted_footfall,
          heatZoneProbability: heatZone?.heat_zone_probability || 0,
          coolingEnergy: coolingZone?.cooling_energy || 100,
          proximityPenalty: 0,
          color: layout.color || 'gray',
          product_category: layout.product_category || ''
        };
      });
      // Calculate metrics from backend data
      const totalFootfall = result.zone_summary.reduce((sum: number, zone: any) => sum + zone.predicted_footfall, 0);
      const avgFootfall = totalFootfall / result.zone_summary.length;
      const maxFootfall = Math.max(...result.zone_summary.map((z: any) => z.predicted_footfall));
      const heatZones = result.heat_zone_summary.filter((h: any) => h.heat_zone_probability > 0.5).length;
      const totalCooling = result.cooling_summary.reduce((sum: number, c: any) => sum + c.cooling_energy, 0);
      const calculatedMetrics = {
        currentVisitors: Math.round(totalFootfall),
        energyReduction: Math.min(50, Math.max(0, 25 - (totalCooling / 100))),
        activeCooling: heatZones,
        predictedPeak: Math.round(maxFootfall),
        totalEnergyConsumption: Math.round(totalCooling),
        averageTemperature: 20.5
      };
      // Convert layout suggestions to ML insights
      const mlInsightsData = {
        layoutSuggestions: result.layout_suggestions
          .filter((s: any) => s.zone)
          .map((s: any) => `Zone ${s.zone}: High traffic (${s.predicted_footfall?.toFixed(1)}) detected. Consider layout optimization.`),
        coolingRecommendations: result.layout_suggestions
          .filter((s: any) => s.cooling_cycle)
          .map((s: any) => `Zone ${s.zone}: Increase cooling by ${s.cooling_cycle?.increase}x from ${s.cooling_cycle?.start_hour}:00-${s.cooling_cycle?.end_hour}:00`),
        trafficPredictions: {
          nextHour: Math.round(avgFootfall * 1.1),
          nextDay: Math.round(avgFootfall * 1.2),
          peakTime: '12:00'
        },
        energyOptimizations: {
          potentialSavings: Math.round(totalCooling * 0.15),
          recommendations: ['Implement dynamic cooling schedules', 'Optimize refrigeration zones']
        },
        rmse: result.rmse,
        r2_score: result.r2_score
      };
      setZones(convertedZones);
      setMetrics(calculatedMetrics);
      setMLInsights(mlInsightsData);
      setLayoutSuggestions(result.layout_suggestions || []);
      setRearrangementSuggestions(result.rearrangement_suggestions || []);
      setHeatZoneSummary(result.heat_zone_summary || []);
      setCoolingSummary(result.cooling_summary || []);
      setProphetForecast(result.prophet_forecast || []);
      setZoneTrafficForecast(result.zone_traffic_forecast || []);
      setSimulatedEnergyUsage(result.simulated_energy_usage);
      setDetailedZoneSuggestions(result.detailed_zone_suggestions || []);
      setSuggestedLayout(result.suggested_layout || {});
      setLayoutMoves(result.layout_moves || []);
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to import CSV file:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    zones,
    metrics,
    updateZoneData,
    updateMetrics,
    importDataset,
    importCSVFile,
    isConnected,
    lastUpdate,
    mlInsights,
    dataProcessor,
    isLoading,
    layoutSuggestions,
    rearrangementSuggestions,
    heatZoneSummary,
    coolingSummary,
    prophetForecast,
    zoneTrafficForecast,
    simulatedEnergyUsage,
    detailedZoneSuggestions,
    suggestedLayout,
    layoutMoves
  };
};
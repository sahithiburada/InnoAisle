import Papa from 'papaparse';

export interface RawZoneData {
  timestamp: string;
  zone_id: string;
  footfall: number;
  zone_temp?: number;
  sales_volume?: number;
  phase?: string;
  product_category?: string;
  day_of_week?: string;
}

export interface ProcessedZoneData {
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
  trafficScore: number;
  heatZoneProbability: number;
  coolingEnergy: number;
  proximityPenalty: number;
}

export interface ProcessedMetrics {
  currentVisitors: number;
  energyReduction: number;
  activeCooling: number;
  predictedPeak: number;
  totalEnergyConsumption: number;
  averageTemperature: number;
  totalFootfall: number;
  averageFootfall: number;
  peakHour: number;
  lowTrafficZones: string[];
  highTrafficZones: string[];
  heatZones: string[];
}

export interface MLInsights {
  layoutSuggestions: string[];
  coolingRecommendations: string[];
  trafficPredictions: {
    nextHour: number;
    nextDay: number;
    peakTime: string;
  };
  energyOptimizations: {
    potentialSavings: number;
    recommendations: string[];
  };
  rmse?: number;
  r2_score?: number;
}

// Zone layout configuration
const ZONE_LAYOUT = {
  'Z1': { name: 'Dairy & Frozen', x: 50, y: 100, width: 120, height: 80, isRefrigeration: true },
  'Z2': { name: 'Fresh Produce', x: 200, y: 100, width: 120, height: 80, isRefrigeration: true },
  'Z3': { name: 'Beverages', x: 350, y: 100, width: 100, height: 80, isRefrigeration: false },
  'Z4': { name: 'Electronics', x: 480, y: 100, width: 120, height: 80, isRefrigeration: false },
  'Z5': { name: 'Clothing', x: 50, y: 220, width: 150, height: 80, isRefrigeration: false },
  'Z6': { name: 'Pharmacy', x: 230, y: 220, width: 100, height: 80, isRefrigeration: false },
  'Z7': { name: 'Grocery', x: 360, y: 220, width: 120, height: 80, isRefrigeration: false },
  'Z8': { name: 'Customer Service', x: 510, y: 220, width: 90, height: 80, isRefrigeration: false },
};

export class DataProcessor {
  private rawData: RawZoneData[] = [];
  private processedZones: ProcessedZoneData[] = [];
  private processedMetrics: ProcessedMetrics | null = null;
  private mlInsights: MLInsights | null = null;

  async processCSVData(csvFile: File): Promise<{
    zones: ProcessedZoneData[];
    metrics: ProcessedMetrics;
    insights: MLInsights;
  }> {
    try {
      // Parse CSV file
      const csvText = await this.readFileAsText(csvFile);
      const parsedData = Papa.parse(csvText, { header: true });
      
      if (parsedData.errors.length > 0) {
        throw new Error(`CSV parsing errors: ${parsedData.errors.map(e => e.message).join(', ')}`);
      }

      this.rawData = parsedData.data as RawZoneData[];
      
      // Process the data
      this.processedZones = this.processZoneData();
      this.processedMetrics = this.calculateMetrics();
      this.mlInsights = this.generateMLInsights();

      return {
        zones: this.processedZones,
        metrics: this.processedMetrics,
        insights: this.mlInsights
      };
    } catch (error) {
      console.error('Error processing CSV data:', error);
      throw error;
    }
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private processZoneData(): ProcessedZoneData[] {
    const zoneStats = new Map<string, {
      footfall: number[];
      temperature: number[];
      salesVolume: number[];
      productCategories: Set<string>;
      timestamps: Date[];
    }>();

    // Aggregate data by zone
    this.rawData.forEach(row => {
      const zoneId = row.zone_id;
      if (!zoneStats.has(zoneId)) {
        zoneStats.set(zoneId, {
          footfall: [],
          temperature: [],
          salesVolume: [],
          productCategories: new Set(),
          timestamps: []
        });
      }

      const stats = zoneStats.get(zoneId)!;
      stats.footfall.push(row.footfall);
      if (row.zone_temp) stats.temperature.push(row.zone_temp);
      if (row.sales_volume) stats.salesVolume.push(row.sales_volume);
      if (row.product_category) stats.productCategories.add(row.product_category);
      stats.timestamps.push(new Date(row.timestamp));
    });

    // Convert to processed zone data
    return Array.from(zoneStats.entries()).map(([zoneId, stats]) => {
      const layout = ZONE_LAYOUT[zoneId as keyof typeof ZONE_LAYOUT];
      if (!layout) {
        throw new Error(`Unknown zone ID: ${zoneId}`);
      }

      const avgFootfall = stats.footfall.reduce((a, b) => a + b, 0) / stats.footfall.length;
      const avgTemperature = stats.temperature.length > 0 
        ? stats.temperature.reduce((a, b) => a + b, 0) / stats.temperature.length
        : layout.isRefrigeration ? 4 : 24;
      
      const maxFootfall = Math.max(...stats.footfall);
      const heatZoneProbability = avgFootfall > 60 ? 0.8 : avgFootfall > 40 ? 0.5 : 0.2;
      const coolingEnergy = layout.isRefrigeration ? 400 : 100 + (avgFootfall * 2);
      const proximityPenalty = layout.isRefrigeration && avgFootfall > 60 ? avgFootfall * 2 : 0;

      return {
        id: zoneId,
        name: layout.name,
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
        footfall: Math.round(avgFootfall),
        temperature: Math.round(avgTemperature * 10) / 10,
        heatProduction: Math.round(avgFootfall * 15 + (avgTemperature * 50)),
        products: Array.from(stats.productCategories),
        isRefrigeration: layout.isRefrigeration,
        energyConsumption: Math.round(coolingEnergy),
        lastUpdated: new Date(Math.max(...stats.timestamps.map(t => t.getTime()))),
        trafficScore: avgFootfall,
        heatZoneProbability,
        coolingEnergy: Math.round(coolingEnergy),
        proximityPenalty: Math.round(proximityPenalty)
      };
    });
  }

  private calculateMetrics(): ProcessedMetrics {
    const totalFootfall = this.processedZones.reduce((sum, zone) => sum + zone.footfall, 0);
    const avgFootfall = totalFootfall / this.processedZones.length;
    const avgTemperature = this.processedZones.reduce((sum, zone) => sum + zone.temperature, 0) / this.processedZones.length;
    
    // Find peak hour from raw data
    const hourlyData = new Map<number, number>();
    this.rawData.forEach(row => {
      const hour = new Date(row.timestamp).getHours();
      hourlyData.set(hour, (hourlyData.get(hour) || 0) + row.footfall);
    });
    const peakHour = Array.from(hourlyData.entries()).reduce((a, b) => a[1] > b[1] ? a : b)[0];

    const highTrafficZones = this.processedZones
      .filter(zone => zone.footfall > 60)
      .map(zone => zone.id);
    
    const lowTrafficZones = this.processedZones
      .filter(zone => zone.footfall < 30)
      .map(zone => zone.id);

    const heatZones = this.processedZones
      .filter(zone => zone.heatZoneProbability > 0.5)
      .map(zone => zone.id);

    const totalEnergyConsumption = this.processedZones.reduce((sum, zone) => sum + zone.energyConsumption, 0);
    const energyReduction = Math.min(50, Math.max(0, 25 - (totalEnergyConsumption / 100)));

    return {
      currentVisitors: Math.round(totalFootfall),
      energyReduction: Math.round(energyReduction),
      activeCooling: this.processedZones.filter(zone => zone.isRefrigeration).length,
      predictedPeak: Math.round(avgFootfall * 1.5),
      totalEnergyConsumption: Math.round(totalEnergyConsumption),
      averageTemperature: Math.round(avgTemperature * 10) / 10,
      totalFootfall: Math.round(totalFootfall),
      averageFootfall: Math.round(avgFootfall),
      peakHour,
      lowTrafficZones,
      highTrafficZones,
      heatZones
    };
  }

  private generateMLInsights(): MLInsights {
    const layoutSuggestions: string[] = [];
    const coolingRecommendations: string[] = [];
    const energyRecommendations: string[] = [];

    // Analyze high-traffic zones near refrigeration
    const highTrafficRefrigerationZones = this.processedZones.filter(
      zone => zone.isRefrigeration && zone.footfall > 60
    );

    highTrafficRefrigerationZones.forEach(zone => {
      layoutSuggestions.push(
        `Zone ${zone.id} (${zone.name}) has high traffic (${zone.footfall}) near refrigeration. Consider moving non-critical products away from cold storage.`
      );
    });

    // Analyze heat zones
    const heatZones = this.processedZones.filter(zone => zone.heatZoneProbability > 0.5);
    heatZones.forEach(zone => {
      coolingRecommendations.push(
        `Zone ${zone.id} (${zone.name}) shows heat zone characteristics. Increase cooling by 1.5x during peak hours (${this.processedMetrics?.peakHour}:00).`
      );
    });

    // Energy optimization suggestions
    const totalEnergy = this.processedZones.reduce((sum, zone) => sum + zone.energyConsumption, 0);
    const potentialSavings = Math.round(totalEnergy * 0.15); // 15% potential savings

    if (potentialSavings > 100) {
      energyRecommendations.push(
        `Implement dynamic cooling schedules during low-traffic hours (${this.processedMetrics?.lowTrafficZones.join(', ')})`
      );
      energyRecommendations.push(
        `Optimize refrigeration zones (${this.processedZones.filter(z => z.isRefrigeration).map(z => z.id).join(', ')}) with smart temperature controls`
      );
    }

    // Traffic predictions based on historical patterns
    const currentHour = new Date().getHours();
    const nextHourPrediction = Math.round(this.processedMetrics?.averageFootfall || 0 * (currentHour >= 9 && currentHour <= 17 ? 1.2 : 0.8));
    const nextDayPrediction = Math.round((this.processedMetrics?.averageFootfall || 0) * 1.1);

    return {
      layoutSuggestions,
      coolingRecommendations,
      trafficPredictions: {
        nextHour: nextHourPrediction,
        nextDay: nextDayPrediction,
        peakTime: `${this.processedMetrics?.peakHour}:00`
      },
      energyOptimizations: {
        potentialSavings,
        recommendations: energyRecommendations
      }
    };
  }

  getRealTimeData() {
    return {
      zones: this.processedZones,
      metrics: this.processedMetrics,
      insights: this.mlInsights
    };
  }
} 
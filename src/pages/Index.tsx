import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Zap, 
  TrendingUp, 
  Thermometer, 
  BarChart3, 
  Settings, 
  Store,
  Brain,
  Activity,
  Upload,
  Database
} from 'lucide-react';
import MetricCard from '@/components/MetricCard';
import EnhancedStoreBlueprint from '@/components/EnhancedStoreBlueprint';
import TrafficChart from '@/components/TrafficChart';
import EnergyOptimizer, { LayoutSuggestion, RearrangementSuggestion } from '@/components/EnergyOptimizer';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import ProphetForecastChart from '@/components/ProphetForecastChart';
import EnergyConsumptionChart from '@/components/EnergyConsumptionChart';
import ForecastFallbackImg from '@/assets/forecast_fallback.png'; // Place your image in src/assets and use this import

const Index = () => {
  const [activeView, setActiveView] = useState<'overview' | 'blueprint' | 'rearrangement'>('overview');
  const [isUploading, setIsUploading] = useState(false);
  const { 
    zones, 
    metrics, 
    importCSVFile, 
    mlInsights, 
    isConnected, 
    lastUpdate,
    layoutSuggestions,
    rearrangementSuggestions,
    heatZoneSummary,
    coolingSummary,
    prophetForecast,
    zoneTrafficForecast,
    simulatedEnergyUsage,
    suggestedLayout,
    layoutMoves
  } = useRealTimeData({
    dataSource: 'file'
  });

  // Use real backend data for Prophet forecast, mapping ds -> date
  const prophetForecastData = (prophetForecast || []).map(d => ({
    date: d.ds,
    yhat: d.yhat,
    yhat_lower: d.yhat_lower,
    yhat_upper: d.yhat_upper,
    actual: d.actual // if available
  }));
  const energyConsumptionData = zones.map(z => ({
    zone: z.id,
    energyConsumption: z.energyConsumption
  }));
  const zoneTrafficData = (zoneTrafficForecast || []).map(z => ({
    zone: z.zone,
    predicted_footfall: z.predicted_footfall
  }));

  // Helper: Generate detailed suggestions for each zone from zoneTrafficForecast
  const detailedZoneSuggestions = (zoneTrafficForecast || []).map(z => {
    let suggestion = '';
    const isRefrigeration = ['Z1', 'Z2'].includes(z.zone);
    const penalty = z.penalty !== undefined ? z.penalty : 0;
    if (isRefrigeration && z.predicted_footfall > 40) {
      suggestion = `Increase cooling: Adjust temperature from 24.4°C to 22.4°C.`;
    } else if (isRefrigeration && z.predicted_footfall > 30) {
      suggestion = `Monitor cooling; consider adjustment if footfall exceeds 40.`;
    } else if (z.predicted_footfall > 50 && !isRefrigeration && ['Z3','Z4','Z5','Z6'].includes(z.zone)) {
      suggestion = `Warning: High traffic. Consider redistributing items or partial move.`;
    } else {
      suggestion = `No adjustment needed.`;
    }
    return {
      zone: z.zone,
      predicted_footfall: z.predicted_footfall,
      penalty,
      suggestion
    };
  });

  const hasData = zones.length > 0 && metrics !== null;

  const handleDatasetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        await importCSVFile(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Store className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">InnoAisle</h1>
                  <p className="text-sm text-muted-foreground">Walmart Store Intelligence Platform</p>
                </div>
              </div>
              <Badge className="bg-success/10 text-success border-success/20">
                Analytics
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleDatasetUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <Button variant="outline" className="gap-2" disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Processing...' : 'Upload CSV Data'}
                </Button>
              </div>
              <Button
                variant={activeView === 'overview' ? 'default' : 'outline'}
                onClick={() => setActiveView('overview')}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Overview
              </Button>
              <Button
                variant={activeView === 'blueprint' ? 'default' : 'outline'}
                onClick={() => setActiveView('blueprint')}
                className="gap-2"
              >
                <Store className="h-4 w-4" />
                Blueprint
              </Button>
              <Button
                variant={activeView === 'rearrangement' ? 'default' : 'outline'}
                onClick={() => setActiveView('rearrangement')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                AI Optimizer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Only show analytics if real backend data is present */}
        {hasData ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Current Store Traffic"
                value={metrics.currentVisitors}
                subtitle="visitors in store"
                icon={Users}
                trend={{ value: 12, label: 'vs last hour', isPositive: true }}
                variant="primary"
              />
              <MetricCard
                title="Energy Optimization"
                value={`${metrics.energyReduction}%`}
                subtitle="reduction achieved"
                icon={Zap}
                trend={{ value: 5, label: 'vs yesterday', isPositive: true }}
                variant="accent"
              />
              <MetricCard
                title="Active Cooling Zones"
                value={metrics.activeCooling}
                subtitle="of 8 zones"
                icon={Thermometer}
                variant="success"
              />
              <MetricCard
                title="Predicted Peak"
                value={metrics.predictedPeak}
                subtitle="visitors at 5:00 PM"
                icon={TrendingUp}
                trend={{ value: 8, label: 'vs forecast', isPositive: false }}
                variant="warning"
              />
            </div>

            {/* Dynamic Content based on active view */}
            {activeView === 'overview' && (
              <div className="space-y-8">
                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Store Blueprint - Large */}
                  <div className="lg:col-span-2">
                    <EnhancedStoreBlueprint 
                      zones={zones} 
                      showHeatMap={true} 
                      showFootfall={true}
                      showHeatProduction={true}
                    />
                  </div>
                  {/* AI Insights Panel */}
                  <div className="space-y-6">
                    <Card className="p-6 bg-gradient-card border-0 shadow-medium">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">ML Insights</h3>
                      </div>
                      <div className="space-y-4">
                        {mlInsights ? (
                          <>
                            {mlInsights.layoutSuggestions.length > 0 && (
                              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Settings className="h-4 w-4 text-warning" />
                                  <span className="text-sm font-medium text-warning">Layout Suggestions</span>
                                </div>
                                <div className="space-y-2">
                                  {mlInsights.layoutSuggestions.slice(0, 2).map((suggestion, index) => (
                                    <p key={index} className="text-sm text-muted-foreground">
                                      {suggestion}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            {mlInsights.coolingRecommendations.length > 0 && (
                              <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Thermometer className="h-4 w-4 text-info" />
                                  <span className="text-sm font-medium text-info">Cooling Recommendations</span>
                                </div>
                                <div className="space-y-2">
                                  {mlInsights.coolingRecommendations.slice(0, 2).map((rec, index) => (
                                    <p key={index} className="text-sm text-muted-foreground">
                                      {rec}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Activity className="h-4 w-4 text-success" />
                                <span className="text-sm font-medium text-success">Traffic Predictions</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Next hour: {mlInsights.trafficPredictions.nextHour} visitors | 
                                Peak time: {mlInsights.trafficPredictions.peakTime}
                              </p>
                            </div>
                            <div className="p-3 bg-info/10 rounded-lg border border-info/20">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="h-4 w-4 text-info" />
                                <span className="text-sm font-medium text-info">Model Performance</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                RMSE: {mlInsights.rmse?.toFixed(2) || 'N/A'} | 
                                R² Score: {mlInsights.r2_score?.toFixed(3) || 'N/A'}
                              </p>
                            </div>
                            {mlInsights.energyOptimizations.potentialSavings > 0 && (
                              <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Zap className="h-4 w-4 text-accent" />
                                  <span className="text-sm font-medium text-accent">Energy Savings</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Potential savings: ${mlInsights.energyOptimizations.potentialSavings}/day
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="p-3 bg-muted/10 rounded-lg border border-muted/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">No Data Loaded</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Upload your CSV dataset to see ML-powered insights and recommendations.
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                    <Card className="p-6 bg-gradient-primary text-primary-foreground border-0 shadow-glow">
                      <h3 className="text-lg font-semibold mb-3">Performance</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-2xl font-bold">97.2%</div>
                          <div className="text-sm opacity-90">Prediction Accuracy</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">$847</div>
                          <div className="text-sm opacity-90">Daily Savings</div>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-primary-foreground/20">
                        <div className="flex items-center gap-2 text-sm">
                          <Database className="w-4 h-4" />
                          <span className={`${isConnected ? 'text-success' : 'text-destructive'}`}>
                            {isConnected ? 'Data Connected' : 'Connection Lost'}
                          </span>
                        </div>
                        {lastUpdate && (
                          <div className="text-xs opacity-80 mt-1">
                            Last update: {lastUpdate.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
                {/* Add Simulated Energy Usage Metric Card above charts */}
                {hasData && simulatedEnergyUsage !== undefined && (
                  <div className="mb-8">
                    <MetricCard
                      title="Simulated Energy Usage"
                      value={simulatedEnergyUsage.toFixed(2)}
                      subtitle="for Monday, 08:00 IST"
                      icon={Zap}
                      variant="accent"
                    />
                  </div>
                )}
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {prophetForecastData.length > 0 ? (
                    <ProphetForecastChart data={prophetForecastData} />
                  ) : (
                    <div className="flex items-center justify-center h-[350px] bg-white rounded-lg shadow">
                      <img src={ForecastFallbackImg} alt="Footfall Forecast for Next 7 Days" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <EnergyConsumptionChart data={energyConsumptionData} />
                </div>


              </div>
            )}
            {activeView === 'blueprint' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  <div className="xl:col-span-3">
                    <EnhancedStoreBlueprint 
                      zones={zones} 
                      showHeatMap={true} 
                      showFootfall={true}
                      showHeatProduction={true}
                    />
                  </div>
                  <div>
                    <TrafficChart 
                      type="zones" 
                      title="Zone Analytics"
                      data={zones.map(z => ({
                        zone: z.id,
                        footfall: z.footfall,
                        energyConsumption: z.energyConsumption
                      }))}
                    />
                  </div>
                </div>
                {/* New charts for heat zone probability and cooling energy demand */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrafficChart 
                    type="zones"
                    title="Heat Zone Probability per Zone"
                    data={heatZoneSummary.map(h => ({
                      zone: h.zone,
                      footfall: h.heat_zone_probability * 100, // as percentage
                      energyConsumption: 0 // not used
                    }))}
                  />
                  <TrafficChart 
                    type="zones"
                    title="Average Cooling Energy Demand per Zone"
                    data={coolingSummary.map(c => ({
                      zone: c.zone,
                      footfall: 0, // not used
                      energyConsumption: c.cooling_energy
                    }))}
                  />
                </div>
                {/* Remove Traffic Predictions and Energy Consumption charts */}
              </div>
            )}
            {activeView === 'rearrangement' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2">
                    <EnhancedStoreBlueprint 
                      zones={zones} 
                      showHeatMap={true} 
                      showRearrangement={true}
                      showFootfall={true}
                      showHeatProduction={true}
                      suggestedLayout={suggestedLayout}
                      layoutMoves={layoutMoves}
                    />
                  </div>
                  <div>
                    <EnergyOptimizer 
                      layoutSuggestions={layoutSuggestions}
                      rearrangementSuggestions={rearrangementSuggestions}
                    />
                    {/* Render backend detailed zone suggestions below AI Energy Optimizer */}
                    {detailedZoneSuggestions.length > 0 && (
                      <div className="mt-6 p-4 bg-gradient-card rounded-lg shadow">
                        <div className="font-semibold mb-2 text-accent">Cooling and Layout Suggestions for Monday, July 14, 2025, 08:00 IST:</div>
                        <div className="space-y-2">
                          {detailedZoneSuggestions.map((s, idx) => (
                            <div key={s.zone} className="border-b pb-2 mb-2 last:border-b-0 last:mb-0">
                              <div className="font-medium">• Zone {s.zone} (Predicted Footfall: {s.predicted_footfall?.toFixed(2) || '0.00'}, Penalty: {s.penalty?.toFixed(2) || '0.00'})</div>
                              <div className="text-sm text-muted-foreground">→ {s.suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Loaded</h3>
              <p className="text-muted-foreground mb-6">
                Upload your CSV dataset to see ML-powered insights and analytics.
              </p>
              <div className="relative inline-block">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleDatasetUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <Button variant="default" className="gap-2" disabled={isUploading}>
                  <Upload className="h-4 w-4" />
                  {isUploading ? 'Processing...' : 'Upload Your CSV Data'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;

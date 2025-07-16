import React from 'react';
import { Card } from '@/components/ui/card';
import { LucideIcon, RefreshCw } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  className?: string;
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className = '',
  isLoading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-primary text-primary-foreground border-0 shadow-glow';
      case 'accent':
        return 'bg-gradient-accent text-accent-foreground border-0 shadow-glow';
      case 'success':
        return 'bg-success/10 border-success/20 shadow-soft';
      case 'warning':
        return 'bg-warning/10 border-warning/20 shadow-soft';
      default:
        return 'bg-gradient-card border-0 shadow-medium';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'primary':
        return 'text-primary-foreground/80';
      case 'accent':
        return 'text-accent-foreground/80';
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={`p-6 transition-all duration-300 hover:scale-105 animate-fade-in ${getVariantStyles()} ${className} ${isLoading ? 'opacity-75' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${variant === 'primary' || variant === 'accent' ? 'bg-white/20' : 'bg-primary/10'}`}>
              {isLoading ? (
                <RefreshCw className={`h-5 w-5 ${getIconColor()} animate-spin`} />
              ) : (
              <Icon className={`h-5 w-5 ${getIconColor()}`} />
              )}
            </div>
            <h3 className="font-medium text-sm opacity-90">{title}</h3>
            {isLoading && (
              <div className="ml-auto">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {subtitle && (
              <p className="text-sm opacity-75">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 pt-4 border-t border-current/10">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive 
                ? 'bg-success/20 text-success' 
                : 'bg-destructive/20 text-destructive'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
            <span className="text-xs opacity-75">{trend.label}</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
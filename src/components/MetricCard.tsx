import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend, onClick }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
    >
      <Card 
        className={`
          p-6 gradient-navy-vertical border-2 border-primary/20
          transition-all duration-300
          ${onClick ? 'cursor-pointer hover:shadow-elevated hover:border-accent' : ''}
        `}
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/80 mb-2">{title}</p>
            <p className="text-3xl font-bold text-white mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-white/60">{subtitle}</p>
            )}
            {trend && (
              <div className={`
                inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs font-semibold
                ${trend.isPositive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}
              `}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          <div className="p-3 bg-white/10 rounded-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

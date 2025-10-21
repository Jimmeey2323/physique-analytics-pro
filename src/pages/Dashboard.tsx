import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Calendar, BarChart3, AlertCircle } from 'lucide-react';
import { FileUploader } from '@/components/FileUploader';
import { MetricCard } from '@/components/MetricCard';
import { FilterBar } from '@/components/FilterBar';
import { AnalyticsTable } from '@/components/AnalyticsTable';
import { DrilldownModal } from '@/components/DrilldownModal';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { ProcessedData } from '@/types/data';
import { formatCurrency } from '@/utils/dataProcessor';

export default function Dashboard() {
  const { individualClasses, aggregatedData } = useAnalyticsStore();
  const [drilldownData, setDrilldownData] = useState<ProcessedData[]>([]);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);

  const metrics = useMemo(() => {
    if (aggregatedData.length === 0) return null;

    const totalClasses = aggregatedData.reduce((sum, d) => sum + d.totalOccurrences, 0);
    const totalAttendance = aggregatedData.reduce((sum, d) => sum + d.totalCheckins, 0);
    const totalRevenue = aggregatedData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalCancellations = aggregatedData.reduce((sum, d) => sum + d.totalCancelled, 0);
    const avgAttendance = totalClasses > 0 ? totalAttendance / totalClasses : 0;
    const avgRevenue = totalClasses > 0 ? totalRevenue / totalClasses : 0;
    const cancellationRate = (totalAttendance + totalCancellations) > 0 
      ? (totalCancellations / (totalAttendance + totalCancellations)) * 100 
      : 0;

    return {
      totalClasses,
      totalAttendance,
      totalRevenue,
      avgAttendance,
      avgRevenue,
      cancellationRate,
    };
  }, [aggregatedData]);

  const handleMetricDrilldown = (filterFn: (d: ProcessedData) => boolean) => {
    const filtered = individualClasses.filter(filterFn);
    setDrilldownData(filtered);
    setIsDrilldownOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-navy border-b border-primary/20 shadow-soft">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Physique 57 India Analytics
            </h1>
            <p className="text-white/80 text-sm">
              Advanced class performance tracking and insights platform
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* File Uploader */}
        {individualClasses.length === 0 && (
          <section>
            <FileUploader />
            <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-2">Getting Started</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Upload your momence-teachers-payroll-report-combined.csv file (or ZIP containing it)</li>
                    <li>• Data will be automatically normalized and cleaned</li>
                    <li>• View insights across 15+ grouping dimensions</li>
                    <li>• Drill down into any metric for detailed analytics</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Dashboard Content */}
        {individualClasses.length > 0 && (
          <>
            {/* Metrics Overview */}
            <section>
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold mb-4"
              >
                Key Performance Metrics
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Classes"
                  value={metrics?.totalClasses || 0}
                  subtitle={`${aggregatedData.length} unique groups`}
                  icon={Calendar}
                  onClick={() => handleMetricDrilldown(() => true)}
                />
                <MetricCard
                  title="Total Attendance"
                  value={metrics?.totalAttendance || 0}
                  subtitle={`Avg: ${metrics?.avgAttendance.toFixed(1) || 0} per class`}
                  icon={Users}
                  onClick={() => handleMetricDrilldown((d) => d.totalCheckins > 0)}
                />
                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(metrics?.totalRevenue || 0, true)}
                  subtitle={`Avg: ${formatCurrency(metrics?.avgRevenue || 0, true)} per class`}
                  icon={DollarSign}
                  onClick={() => handleMetricDrilldown((d) => d.totalRevenue > 0)}
                />
                <MetricCard
                  title="Cancellation Rate"
                  value={`${metrics?.cancellationRate.toFixed(1) || 0}%`}
                  subtitle="Late cancellations / total bookings"
                  icon={TrendingUp}
                  onClick={() => handleMetricDrilldown((d) => d.totalCancelled > 0)}
                />
              </div>
            </section>

            {/* Filters */}
            <section>
              <FilterBar />
            </section>

            {/* Analytics Table */}
            <section>
              <AnalyticsTable 
                onDrilldown={(data) => {
                  setDrilldownData(data);
                  setIsDrilldownOpen(true);
                }}
              />
            </section>

            {/* Upload New File */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Upload New Data</h2>
              <FileUploader />
            </section>
          </>
        )}
      </main>

      {/* Drilldown Modal */}
      <DrilldownModal
        isOpen={isDrilldownOpen}
        onClose={() => setIsDrilldownOpen(false)}
        data={drilldownData}
      />
    </div>
  );
}

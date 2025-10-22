import { X, TrendingUp, Users, DollarSign, Calendar, Filter, MapPin, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProcessedData } from '@/types/data';
import { formatCurrency } from '@/utils/dataProcessor';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProcessedData[];
}

export function DrilldownModal({ isOpen, onClose, data }: DrilldownModalProps) {
  const { filters, setFilters } = useAnalyticsStore();
  
  if (data.length === 0) return null;

  const totals = data.reduce((acc, item) => ({
    classes: acc.classes + item.totalOccurrences,
    attendance: acc.attendance + item.totalCheckins,
    revenue: acc.revenue + item.totalRevenue,
    cancelled: acc.cancelled + item.totalCancelled,
  }), { classes: 0, attendance: 0, revenue: 0, cancelled: 0 });

  const uniqueLocations = [...new Set(data.map(d => d.location))];
  const uniqueTeachers = [...new Set(data.map(d => d.teacherName))];
  const uniqueClasses = [...new Set(data.map(d => d.cleanedClass))];

  const hasActiveFilters = filters.dateRange.start || filters.dateRange.end || 
    filters.locations.length > 0 || filters.teachers.length > 0 || 
    filters.classes.length > 0 || filters.textSearch;

  const applyQuickFilter = (type: 'location' | 'teacher' | 'class', value: string) => {
    const newFilters = { ...filters };
    switch (type) {
      case 'location':
        newFilters.locations = [value];
        break;
      case 'teacher':
        newFilters.teachers = [value];
        break;
      case 'class':
        newFilters.classes = [value];
        break;
    }
    setFilters(newFilters);
    onClose();
  };

  const avgAttendance = totals.classes > 0 ? totals.attendance / totals.classes : 0;
  const fillRate = totals.classes > 0 && data[0].capacity ? (avgAttendance / data[0].capacity) * 100 : 0;
  const cancelRate = (totals.attendance + totals.cancelled) > 0 
    ? (totals.cancelled / (totals.attendance + totals.cancelled)) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-navy text-white p-4 -m-6 mb-4">
            Detailed Class Analytics
          </DialogTitle>
          <DialogDescription className="sr-only">
            View detailed analytics and metrics for the selected group of classes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="p-3 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.dateRange.start && (
                  <Badge variant="secondary" className="text-xs">
                    From: {filters.dateRange.start}
                  </Badge>
                )}
                {filters.dateRange.end && (
                  <Badge variant="secondary" className="text-xs">
                    To: {filters.dateRange.end}
                  </Badge>
                )}
                {filters.locations.map(loc => (
                  <Badge key={loc} variant="secondary" className="text-xs">
                    📍 {loc}
                  </Badge>
                ))}
                {filters.teachers.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    👤 {t}
                  </Badge>
                ))}
                {filters.classes.map(c => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    📚 {c}
                  </Badge>
                ))}
                {filters.textSearch && (
                  <Badge variant="secondary" className="text-xs">
                    🔍 "{filters.textSearch}"
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Quick Filter Buttons */}
          <div className="space-y-3">
            {uniqueLocations.length > 1 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Filter by Location:
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueLocations.map(loc => (
                    <Button
                      key={loc}
                      size="sm"
                      variant="outline"
                      onClick={() => applyQuickFilter('location', loc)}
                      className="text-xs"
                    >
                      {loc}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {uniqueTeachers.length > 1 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <User className="w-3 h-3" /> Filter by Teacher:
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueTeachers.map(teacher => (
                    <Button
                      key={teacher}
                      size="sm"
                      variant="outline"
                      onClick={() => applyQuickFilter('teacher', teacher)}
                      className="text-xs"
                    >
                      {teacher}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {uniqueClasses.length > 1 && (
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" /> Filter by Class:
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueClasses.map(cls => (
                    <Button
                      key={cls}
                      size="sm"
                      variant="outline"
                      onClick={() => applyQuickFilter('class', cls)}
                      className="text-xs"
                    >
                      {cls}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg gradient-navy-vertical text-white"
            >
              <Calendar className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{totals.classes}</p>
              <p className="text-xs opacity-80">Total Classes</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg gradient-navy-vertical text-white"
            >
              <Users className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{totals.attendance}</p>
              <p className="text-xs opacity-80">Total Attendance</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg gradient-navy-vertical text-white"
            >
              <DollarSign className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{formatCurrency(totals.revenue, true)}</p>
              <p className="text-xs opacity-80">Total Revenue</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg gradient-navy-vertical text-white"
            >
              <TrendingUp className="w-5 h-5 mb-2 opacity-80" />
              <p className="text-2xl font-bold">{fillRate.toFixed(0)}%</p>
              <p className="text-xs opacity-80">Fill Rate</p>
            </motion.div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg Attendance</p>
              <p className="text-lg font-semibold">{avgAttendance.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Late Cancellations</p>
              <p className="text-lg font-semibold text-destructive">{totals.cancelled}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cancellation Rate</p>
              <p className="text-lg font-semibold">{cancelRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Individual Records */}
          <div>
            <h4 className="font-bold text-lg mb-3">Individual Class Records</h4>
            <ScrollArea className="h-[300px] border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-secondary text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Class</th>
                    <th className="px-3 py-2 text-right">Attendance</th>
                    <th className="px-3 py-2 text-right">Revenue</th>
                    <th className="px-3 py-2 text-right">Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-secondary/50 transition-colors">
                      <td className="px-3 py-2">{item.date}</td>
                      <td className="px-3 py-2">{item.classTime}</td>
                      <td className="px-3 py-2 font-medium">{item.cleanedClass}</td>
                      <td className="px-3 py-2 text-right">{item.totalCheckins}</td>
                      <td className="px-3 py-2 text-right text-success">
                        {formatCurrency(item.totalRevenue, true)}
                      </td>
                      <td className="px-3 py-2 text-right text-destructive">{item.totalCancelled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

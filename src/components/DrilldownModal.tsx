import { X, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProcessedData } from '@/types/data';
import { formatCurrency } from '@/utils/dataProcessor';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProcessedData[];
}

export function DrilldownModal({ isOpen, onClose, data }: DrilldownModalProps) {
  if (data.length === 0) return null;

  const totals = data.reduce((acc, item) => ({
    classes: acc.classes + item.totalOccurrences,
    attendance: acc.attendance + item.totalCheckins,
    revenue: acc.revenue + item.totalRevenue,
    cancelled: acc.cancelled + item.totalCancelled,
  }), { classes: 0, attendance: 0, revenue: 0, cancelled: 0 });

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
        </DialogHeader>

        <div className="space-y-6">
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

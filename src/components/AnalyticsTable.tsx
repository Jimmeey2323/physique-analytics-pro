import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Download, Eye } from 'lucide-react';
import { ProcessedData, GroupedData, GroupingOption } from '@/types/data';
import { formatCurrency, exportToCSV } from '@/utils/dataProcessor';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsTableProps {
  onDrilldown: (data: ProcessedData[]) => void;
}

export function AnalyticsTable({ onDrilldown }: AnalyticsTableProps) {
  const { aggregatedData, filters, selectedGrouping, setSelectedGrouping } = useAnalyticsStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupingOptions: { value: GroupingOption; label: string }[] = [
    { value: 'cleanedClass', label: 'Class Name' },
    { value: 'teacherName', label: 'Teacher Name' },
    { value: 'teacherEmail', label: 'Teacher Email' },
    { value: 'location', label: 'Location' },
    { value: 'dayOfWeek', label: 'Day of Week' },
    { value: 'classTime', label: 'Time Slot' },
    { value: 'period', label: 'Period (Month-Year)' },
    { value: 'day-time-class-teacher', label: 'Day + Time + Class + Teacher' },
    { value: 'day-time-class', label: 'Day + Time + Class' },
    { value: 'teacher-class', label: 'Teacher + Class' },
    { value: 'location-class', label: 'Location + Class' },
    { value: 'time-class', label: 'Time + Class' },
  ];

  const filteredData = useMemo(() => {
    return aggregatedData.filter(item => {
      if (filters.dateRange.start && item.date < filters.dateRange.start) return false;
      if (filters.dateRange.end && item.date > filters.dateRange.end) return false;
      if (filters.locations.length && !filters.locations.includes(item.location)) return false;
      if (filters.teachers.length && !filters.teachers.includes(item.teacherName)) return false;
      if (filters.classes.length && !filters.classes.includes(item.cleanedClass)) return false;
      if (filters.minAttendance !== null && item.classAverageIncludingEmpty < filters.minAttendance) return false;
      if (filters.maxAttendance !== null && item.classAverageIncludingEmpty > filters.maxAttendance) return false;
      if (filters.minRevenue !== null && item.totalRevenue < filters.minRevenue) return false;
      if (filters.maxRevenue !== null && item.totalRevenue > filters.maxRevenue) return false;
      if (filters.textSearch) {
        const search = filters.textSearch.toLowerCase();
        return (
          item.cleanedClass.toLowerCase().includes(search) ||
          item.teacherName.toLowerCase().includes(search) ||
          item.location.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [aggregatedData, filters]);

  const groupedData = useMemo(() => {
    const groups = new Map<string, ProcessedData[]>();
    
    filteredData.forEach(item => {
      let key = '';
      switch (selectedGrouping) {
        case 'day-time-class-teacher':
          key = `${item.dayOfWeek}|${item.classTime}|${item.cleanedClass}|${item.teacherName}`;
          break;
        case 'day-time-class':
          key = `${item.dayOfWeek}|${item.classTime}|${item.cleanedClass}`;
          break;
        case 'teacher-class':
          key = `${item.teacherName}|${item.cleanedClass}`;
          break;
        case 'location-class':
          key = `${item.location}|${item.cleanedClass}`;
          break;
        case 'time-class':
          key = `${item.classTime}|${item.cleanedClass}`;
          break;
        default:
          key = String(item[selectedGrouping as keyof ProcessedData] || 'Unknown');
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([key, items]) => {
      const totalCheckins = items.reduce((sum, i) => sum + i.totalCheckins, 0);
      const totalOccurrences = items.reduce((sum, i) => sum + i.totalOccurrences, 0);
      const totalRevenue = items.reduce((sum, i) => sum + i.totalRevenue, 0);
      const totalCancelled = items.reduce((sum, i) => sum + i.totalCancelled, 0);
      const totalEmpty = items.reduce((sum, i) => sum + i.totalEmpty, 0);
      const totalNonEmpty = items.reduce((sum, i) => sum + i.totalNonEmpty, 0);
      const totalNonPaid = items.reduce((sum, i) => sum + i.totalNonPaid, 0);

      const firstItem = items[0];
      return {
        groupKey: key,
        ...firstItem,
        totalCheckins,
        totalOccurrences,
        totalRevenue,
        totalCancelled,
        totalEmpty,
        totalNonEmpty,
        totalNonPaid,
        classAverageIncludingEmpty: totalOccurrences > 0 ? totalCheckins / totalOccurrences : 0,
        classAverageExcludingEmpty: totalNonEmpty > 0 ? totalCheckins / totalNonEmpty : 0,
        fillRate: totalOccurrences > 0 && firstItem.capacity ? (totalCheckins / totalOccurrences / firstItem.capacity) * 100 : 0,
        lateCancellationRate: (totalCheckins + totalCancelled) > 0 ? (totalCancelled / (totalCheckins + totalCancelled)) * 100 : 0,
        revenuePerAttendee: totalCheckins > 0 ? totalRevenue / totalCheckins : 0,
        children: items,
      } as GroupedData;
    });
  }, [filteredData, selectedGrouping]);

  const totals = useMemo(() => {
    return groupedData.reduce((acc, group) => ({
      totalCheckins: acc.totalCheckins + group.totalCheckins,
      totalOccurrences: acc.totalOccurrences + group.totalOccurrences,
      totalRevenue: acc.totalRevenue + group.totalRevenue,
      totalCancelled: acc.totalCancelled + group.totalCancelled,
      totalEmpty: acc.totalEmpty + group.totalEmpty,
      totalNonEmpty: acc.totalNonEmpty + group.totalNonEmpty,
      totalNonPaid: acc.totalNonPaid + group.totalNonPaid,
    }), {
      totalCheckins: 0,
      totalOccurrences: 0,
      totalRevenue: 0,
      totalCancelled: 0,
      totalEmpty: 0,
      totalNonEmpty: 0,
      totalNonPaid: 0,
    });
  }, [groupedData]);

  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };

  const handleExport = () => {
    const dataToExport = groupedData.map(g => ({
      ...g,
      children: undefined,
      groupKey: undefined,
    }));
    exportToCSV(dataToExport, 'physique57-analytics.csv');
  };

  return (
    <div className="w-full card-luxury overflow-hidden">
      <div className="p-4 gradient-navy flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Analytics Table</h3>
          <p className="text-sm text-white/70">{groupedData.length} groups • {filteredData.length} total classes</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedGrouping} onValueChange={(v) => setSelectedGrouping(v as GroupingOption)}>
            <SelectTrigger className="w-64 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupingOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="gradient-navy text-white text-xs uppercase tracking-wider h-10">
              <th className="px-4 text-left font-bold">Group</th>
              <th className="px-4 text-left font-bold">Location</th>
              <th className="px-4 text-left font-bold">Day</th>
              <th className="px-4 text-left font-bold">Time</th>
              <th className="px-4 text-left font-bold">Teacher</th>
              <th className="px-3 text-right font-bold">Classes</th>
              <th className="px-3 text-right font-bold">Empty</th>
              <th className="px-3 text-right font-bold">Non-Empty</th>
              <th className="px-3 text-right font-bold">Bookings</th>
              <th className="px-3 text-right font-bold">Capacity</th>
              <th className="px-3 text-right font-bold">Fill%</th>
              <th className="px-3 text-right font-bold">Late Cancel</th>
              <th className="px-3 text-right font-bold">Non-Paid</th>
              <th className="px-3 text-right font-bold">Avg w/ Empty</th>
              <th className="px-3 text-right font-bold">Avg w/o Empty</th>
              <th className="px-3 text-right font-bold">Revenue</th>
              <th className="px-3 text-right font-bold">Cancel%</th>
              <th className="px-3 text-center font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedData.map((group, idx) => (
              <motion.tr
                key={group.groupKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.02 }}
                className="border-b border-border hover:bg-table-row-hover transition-colors h-10 max-h-10"
              >
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleGroup(group.groupKey!)}
                    className="flex items-center gap-2 hover:text-accent transition-colors font-medium"
                  >
                    {expandedGroups.has(group.groupKey!) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-xs">{group.cleanedClass}</span>
                  </button>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{group.location}</td>
                <td className="px-4 py-2 text-muted-foreground">{group.dayOfWeek}</td>
                <td className="px-4 py-2 text-muted-foreground">{group.classTime}</td>
                <td className="px-4 py-2 text-muted-foreground truncate max-w-xs">{group.teacherName}</td>
                <td className="px-3 py-2 text-right font-semibold">{group.totalOccurrences}</td>
                <td className="px-3 py-2 text-right text-destructive">{group.totalEmpty}</td>
                <td className="px-3 py-2 text-right text-success">{group.totalNonEmpty}</td>
                <td className="px-3 py-2 text-right font-semibold">{group.totalCheckins}</td>
                <td className="px-3 py-2 text-right">{group.capacity || '-'}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`
                    px-2 py-0.5 rounded text-xs font-semibold
                    ${group.fillRate! > 80 ? 'bg-success/20 text-success' : 
                      group.fillRate! > 50 ? 'bg-warning/20 text-warning' : 
                      'bg-destructive/20 text-destructive'}
                  `}>
                    {group.fillRate!.toFixed(0)}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-destructive">{group.totalCancelled}</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{group.totalNonPaid}</td>
                <td className="px-3 py-2 text-right font-medium">{group.classAverageIncludingEmpty.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-medium">{group.classAverageExcludingEmpty.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-semibold text-success">{formatCurrency(group.totalRevenue, true)}</td>
                <td className="px-3 py-2 text-right">
                  <span className="text-xs">{group.lateCancellationRate!.toFixed(1)}%</span>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => onDrilldown(group.children || [])}
                    className="p-1.5 hover:bg-accent/10 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4 text-accent" />
                  </button>
                </td>
              </motion.tr>
            ))}
            
            {/* Totals Row */}
            <tr className="gradient-navy-vertical text-white font-bold h-10">
              <td className="px-4 py-2" colSpan={5}>TOTALS</td>
              <td className="px-3 py-2 text-right">{totals.totalOccurrences}</td>
              <td className="px-3 py-2 text-right">{totals.totalEmpty}</td>
              <td className="px-3 py-2 text-right">{totals.totalNonEmpty}</td>
              <td className="px-3 py-2 text-right">{totals.totalCheckins}</td>
              <td className="px-3 py-2 text-right">-</td>
              <td className="px-3 py-2 text-right">
                {totals.totalOccurrences > 0 
                  ? ((totals.totalCheckins / totals.totalOccurrences / 12) * 100).toFixed(0) + '%'
                  : '-'}
              </td>
              <td className="px-3 py-2 text-right">{totals.totalCancelled}</td>
              <td className="px-3 py-2 text-right">{totals.totalNonPaid}</td>
              <td className="px-3 py-2 text-right">
                {totals.totalOccurrences > 0 
                  ? (totals.totalCheckins / totals.totalOccurrences).toFixed(1)
                  : '-'}
              </td>
              <td className="px-3 py-2 text-right">
                {totals.totalNonEmpty > 0
                  ? (totals.totalCheckins / totals.totalNonEmpty).toFixed(1)
                  : '-'}
              </td>
              <td className="px-3 py-2 text-right">{formatCurrency(totals.totalRevenue, true)}</td>
              <td className="px-3 py-2 text-right">
                {(totals.totalCheckins + totals.totalCancelled) > 0
                  ? ((totals.totalCancelled / (totals.totalCheckins + totals.totalCancelled)) * 100).toFixed(1) + '%'
                  : '-'}
              </td>
              <td className="px-3 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface RawDataRow {
  'Teacher First Name'?: string;
  'Teacher Last Name'?: string;
  'Teacher Email'?: string;
  'Class name'?: string;
  'Class date'?: string;
  'Location'?: string;
  'Total time (h)'?: number | string;
  'Checked in'?: string | number;
  'Comp'?: number | string;
  'Late Cancelled'?: number | string;
  'Late cancellations'?: number | string;
  'Paid'?: number | string;
  'Non Paid Customers'?: number | string;
  [key: string]: any;
}

export interface ProcessedData {
  // Identity
  teacherName: string;
  teacherEmail: string;
  cleanedClass: string;
  location: string;
  uniqueID: string;
  
  // Time
  date: string;
  classTime: string;
  dayOfWeek: string;
  period: string;
  totalTime: number;
  
  // Metrics
  totalCheckins: number;
  totalOccurrences: number;
  totalRevenue: number;
  totalCancelled: number;
  totalEmpty: number;
  totalNonEmpty: number;
  totalNonPaid: number;
  classAverageIncludingEmpty: number;
  classAverageExcludingEmpty: number;
  
  // Computed
  capacity?: number;
  fillRate?: number;
  lateCancellationRate?: number;
  revenuePerAttendee?: number;
}

export interface GroupedData extends ProcessedData {
  groupKey?: string;
  children?: ProcessedData[];
  isExpanded?: boolean;
  level?: number;
}

export type GroupingOption = 
  | 'cleanedClass'
  | 'teacherName'
  | 'teacherEmail'
  | 'location'
  | 'dayOfWeek'
  | 'classTime'
  | 'period'
  | 'classType'
  | 'revenueBand'
  | 'attendanceBand'
  | 'uniqueID'
  | 'day-time-class-teacher'
  | 'day-time-class'
  | 'teacher-class'
  | 'location-class'
  | 'time-class';

export interface FilterState {
  dateRange: { start: string | null; end: string | null };
  locations: string[];
  teachers: string[];
  classes: string[];
  minAttendance: number | null;
  maxAttendance: number | null;
  minRevenue: number | null;
  maxRevenue: number | null;
  textSearch: string;
}

export interface DrilldownData {
  title: string;
  data: ProcessedData[];
  aggregates: {
    totalClasses: number;
    totalAttendance: number;
    totalRevenue: number;
    avgAttendance: number;
    fillRate: number;
    lateCancellationRate: number;
  };
}

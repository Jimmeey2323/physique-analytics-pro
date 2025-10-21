import { create } from 'zustand';
import { ProcessedData, GroupedData, FilterState, GroupingOption } from '@/types/data';

interface AnalyticsState {
  // Data
  individualClasses: ProcessedData[];
  aggregatedData: ProcessedData[];
  groupedData: GroupedData[];
  
  // UI State
  selectedGrouping: GroupingOption;
  filters: FilterState;
  isLoading: boolean;
  
  // Actions
  setIndividualClasses: (data: ProcessedData[]) => void;
  setAggregatedData: (data: ProcessedData[]) => void;
  setGroupedData: (data: GroupedData[]) => void;
  setSelectedGrouping: (grouping: GroupingOption) => void;
  setFilters: (filters: FilterState) => void;
  setIsLoading: (loading: boolean) => void;
  resetData: () => void;
}

const initialFilters: FilterState = {
  dateRange: { start: null, end: null },
  locations: [],
  teachers: [],
  classes: [],
  minAttendance: null,
  maxAttendance: null,
  minRevenue: null,
  maxRevenue: null,
  textSearch: '',
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  individualClasses: [],
  aggregatedData: [],
  groupedData: [],
  selectedGrouping: 'cleanedClass',
  filters: initialFilters,
  isLoading: false,
  
  setIndividualClasses: (data) => set({ individualClasses: data }),
  setAggregatedData: (data) => set({ aggregatedData: data }),
  setGroupedData: (data) => set({ groupedData: data }),
  setSelectedGrouping: (grouping) => set({ selectedGrouping: grouping }),
  setFilters: (filters) => set({ filters }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  resetData: () => set({
    individualClasses: [],
    aggregatedData: [],
    groupedData: [],
    filters: initialFilters,
  }),
}));

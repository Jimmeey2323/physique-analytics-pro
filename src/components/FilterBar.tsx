import { useState } from 'react';
import { Filter, Calendar, MapPin, User, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAnalyticsStore } from '@/store/analyticsStore';

export function FilterBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { filters, setFilters, individualClasses } = useAnalyticsStore();

  const uniqueLocations = Array.from(new Set(individualClasses.map(c => c.location)));
  const uniqueTeachers = Array.from(new Set(individualClasses.map(c => c.teacherName)));
  const uniqueClasses = Array.from(new Set(individualClasses.map(c => c.cleanedClass)));

  const toggleLocation = (location: string) => {
    const newLocations = filters.locations.includes(location)
      ? filters.locations.filter(l => l !== location)
      : [...filters.locations, location];
    setFilters({ ...filters, locations: newLocations });
  };

  const toggleTeacher = (teacher: string) => {
    const newTeachers = filters.teachers.includes(teacher)
      ? filters.teachers.filter(t => t !== teacher)
      : [...filters.teachers, teacher];
    setFilters({ ...filters, teachers: newTeachers });
  };

  const toggleClass = (className: string) => {
    const newClasses = filters.classes.includes(className)
      ? filters.classes.filter(c => c !== className)
      : [...filters.classes, className];
    setFilters({ ...filters, classes: newClasses });
  };

  const clearFilters = () => {
    setFilters({
      dateRange: { start: null, end: null },
      locations: [],
      teachers: [],
      classes: [],
      minAttendance: null,
      maxAttendance: null,
      minRevenue: null,
      maxRevenue: null,
      textSearch: '',
    });
  };

  const activeFilterCount = 
    filters.locations.length + 
    filters.teachers.length + 
    filters.classes.length + 
    (filters.dateRange.start ? 1 : 0) +
    (filters.minAttendance ? 1 : 0) +
    (filters.minRevenue ? 1 : 0) +
    (filters.textSearch ? 1 : 0);

  return (
    <div className="w-full card-luxury">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 bg-accent text-white text-xs font-semibold rounded">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateRange.start || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, start: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateRange.end || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, end: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Multi-select Locations */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4" />
                  Locations ({filters.locations.length} selected)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {uniqueLocations.map(location => (
                    <button
                      key={location}
                      onClick={() => toggleLocation(location)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-all
                        ${filters.locations.includes(location)
                          ? 'bg-accent text-white'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }
                      `}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-select Teachers */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Teachers ({filters.teachers.length} selected)
                </Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {uniqueTeachers.map(teacher => (
                    <button
                      key={teacher}
                      onClick={() => toggleTeacher(teacher)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-all
                        ${filters.teachers.includes(teacher)
                          ? 'bg-accent text-white'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }
                      `}
                    >
                      {teacher}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multi-select Classes */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4" />
                  Classes ({filters.classes.length} selected)
                </Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {uniqueClasses.map(className => (
                    <button
                      key={className}
                      onClick={() => toggleClass(className)}
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium transition-all
                        ${filters.classes.includes(className)
                          ? 'bg-accent text-white'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }
                      `}
                    >
                      {className}
                    </button>
                  ))}
                </div>
              </div>

              {/* Attendance Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Min Attendance</Label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minAttendance || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      minAttendance: e.target.value ? Number(e.target.value) : null
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Max Attendance</Label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.maxAttendance || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      maxAttendance: e.target.value ? Number(e.target.value) : null
                    })}
                    placeholder="Any"
                  />
                </div>
              </div>

              {/* Revenue Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Min Revenue (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.minRevenue || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      minRevenue: e.target.value ? Number(e.target.value) : null
                    })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Max Revenue (₹)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={filters.maxRevenue || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      maxRevenue: e.target.value ? Number(e.target.value) : null
                    })}
                    placeholder="Any"
                  />
                </div>
              </div>

              {/* Text Search */}
              <div>
                <Label className="mb-2 block">Search</Label>
                <Input
                  type="text"
                  value={filters.textSearch}
                  onChange={(e) => setFilters({ ...filters, textSearch: e.target.value })}
                  placeholder="Search classes, teachers, locations..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

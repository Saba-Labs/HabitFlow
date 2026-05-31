import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { recordStorage, habitStorage } from '@/lib/storage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}

export default function Calendar({ mobileMenuOpen, setMobileMenuOpen }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const records = recordStorage.getRecords();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500/80';
    if (percentage >= 70) return 'bg-emerald-500/80';
    if (percentage >= 50) return 'bg-yellow-500/80';
    if (percentage >= 30) return 'bg-orange-500/80';
    return 'bg-red-500/80';
  };

  const getRecordForDate = (day: number): any => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find(r => r.date === dateStr);
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Month Navigation */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-bold text-foreground">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map(day => {
              const record = getRecordForDate(day);
              const percentage = record?.completionPercentage || 0;
              const colorClass = record
                ? getCompletionColor(percentage)
                : 'bg-muted';

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center font-semibold cursor-pointer transition-all hover:scale-105 ${colorClass}`}
                >
                  <div className="text-sm text-white/90">{day}</div>
                  {record && (
                    <div className="text-xs text-white/70">{percentage}%</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Completion Status</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-green-500/80" />
              <span className="text-sm text-foreground">100% - Perfect Day</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-emerald-500/80" />
              <span className="text-sm text-foreground">70-99% - Strong Day</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-yellow-500/80" />
              <span className="text-sm text-foreground">50-69% - Good Day</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-orange-500/80" />
              <span className="text-sm text-foreground">30-49% - Fair Day</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-red-500/80" />
              <span className="text-sm text-foreground">Below 30% - Needs Work</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-muted" />
              <span className="text-sm text-foreground">No Data</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {records.filter(r => r.completionPercentage === 100).length}
            </div>
            <p className="text-sm text-muted-foreground">Perfect Days</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-secondary mb-2">
              {records.length}
            </div>
            <p className="text-sm text-muted-foreground">Total Days</p>
          </div>
        </div>
      </div>

    </div>
  );
}

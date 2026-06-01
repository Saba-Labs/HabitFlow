import { useEffect, useState } from 'react';
import { Habit, DailyRecord } from '@/types/habit';
import { apiHabitStorage, apiRecordStorage } from '@/lib/api-storage';
import { habitStorage, initializeDefaultHabits } from '@/lib/storage';
import { getDailyQuote } from '@/lib/quotes';
import { CircleProgress } from '@/components/CircleProgress';
import { HabitCard } from '@/components/HabitCard';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Flame, Zap, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';

export default function Dashboard() {
  const { mobileMenuOpen, setMobileMenuOpen } = useMobileMenu();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [streaks, setStreaks] = useState({ current: 0, longest: 0, perfect: 0 });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadRecordForDate(selectedDate);
  }, [selectedDate, habits]);

  const loadData = async () => {
    try {
      let allHabits = await apiHabitStorage.getHabits();

      if (allHabits.length === 0) {
        initializeDefaultHabits();
        allHabits = habitStorage.getHabits();
      }

      setHabits(allHabits);
      setQuote(getDailyQuote());
      setStreaks({ current: 0, longest: 0, perfect: 0 });
    } catch (err) {
      console.error('Error loading data:', err);
      const fallbackHabits = habitStorage.getHabits();
      setHabits(fallbackHabits);
      setQuote(getDailyQuote());
    }
  };

  const loadRecordForDate = async (date: string) => {
    try {
      if (date === new Date().toISOString().split('T')[0]) {
        const todayRecord = await apiRecordStorage.getTodayRecord(habits);
        setRecord(todayRecord);
      } else {
        const record = await apiRecordStorage.getRecordByDate(date, habits);
        setRecord(record);
      }
    } catch (err) {
      console.warn('Failed to fetch record:', err);
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    if (date.toISOString().split('T')[0] <= today) {
      setSelectedDate(date.toISOString().split('T')[0]);
    }
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isFuture = selectedDate > new Date().toISOString().split('T')[0];

  const handleToggleHabit = async (habitId: string) => {
    if (!record) return;
    try {
      await apiRecordStorage.toggleHabit(record.id, habitId);
      const updatedRecord = await apiRecordStorage.getTodayRecord(habits);
      setRecord(updatedRecord);
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };


  const activeHabits = habits.filter(h => !h.archived);
  const completedCount = record?.habits.filter(h => {
    const habit = activeHabits.find(ah => ah.id === h.habitId);
    return habit && h.completed;
  }).length || 0;
  const totalHabits = activeHabits.length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto px-4 py-6 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors text-foreground flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent truncate">
                HabitFlow
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                {isToday && ' (Today)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePreviousDay}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
              aria-label="Previous day"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextDay}
              disabled={isFuture}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next day"
            >
              <ChevronRight size={20} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Progress Card */}
        <div className="bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 rounded-3xl p-8 border border-primary/30">
          <div className="flex flex-col items-center gap-6">
            <CircleProgress percentage={completionPercentage} />
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">{isToday ? "Today's Score" : "Completion Score"}</p>
              <p className="text-lg font-semibold text-foreground">
                {completedCount} of {totalHabits} habits completed
              </p>
            </div>
          </div>
        </div>

        {/* Quote Card */}
        <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
          <p className="text-base italic text-foreground leading-relaxed">
            "{quote}"
          </p>
          <p className="text-xs text-muted-foreground mt-4">Daily Inspiration</p>
        </div>

        {/* Streak Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Flame size={20} className="text-orange-500" />
              <span className="text-2xl font-bold text-foreground">
                {streaks.current}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Current Streak</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Zap size={20} className="text-yellow-500" />
              <span className="text-2xl font-bold text-foreground">
                {streaks.longest}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Longest Streak</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl">⭐</span>
              <span className="text-2xl font-bold text-foreground">
                {streaks.perfect}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Perfect Days</p>
          </div>
        </div>

        {/* Habits Section */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-6">{isToday ? "Today's Habits" : "Habits for " + new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
          {totalHabits === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-4">No habits yet</p>
              <a
                href="/habits"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Go to Habits to create one
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {habits
                .filter(h => !h.archived)
                .sort((a, b) => a.order - b.order)
                .map(habit => {
                  const completion = record?.habits.find(
                    h => h.habitId === habit.id
                  );
                  return (
                    <HabitCard
                      key={habit.id}
                      habit={habit}
                      completion={completion || { habitId: habit.id, completed: false }}
                      onToggle={handleToggleHabit}
                    />
                  );
                })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

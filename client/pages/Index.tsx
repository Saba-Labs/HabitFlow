import { useEffect, useState } from 'react';
import { Habit, DailyRecord } from '@/types/habit';
import {
  habitStorage,
  recordStorage,
  initializeDefaultHabits,
  calculateCompletion,
} from '@/lib/storage';
import { getDailyQuote } from '@/lib/quotes';
import { CircleProgress } from '@/components/CircleProgress';
import { HabitCard } from '@/components/HabitCard';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Plus, Flame } from 'lucide-react';

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    initializeDefaultHabits();
    const allHabits = habitStorage.getHabits();
    setHabits(allHabits);

    const todayRecord = recordStorage.getOrCreateTodayRecord(allHabits);
    setRecord(todayRecord);
    setQuote(getDailyQuote());
  }, []);

  const handleToggleHabit = (habitId: string) => {
    if (!record) return;
    recordStorage.toggleHabit(record.id, habitId);
    const updatedRecord = recordStorage.getRecordForDate(record.date, habits);
    setRecord(updatedRecord);
  };

  const handleAddHabit = () => {
    // Placeholder for add habit modal
    alert('Add habit feature coming soon');
  };

  const completedCount = record?.habits.filter(h => h.completed).length || 0;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">HabitFlow</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Progress Card */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-3xl p-8 border border-primary/20">
          <div className="flex flex-col items-center gap-6">
            <CircleProgress percentage={record?.completionPercentage || 0} />
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Today's Score</p>
              <p className="text-lg font-semibold text-foreground">
                {completedCount} of {habits.filter(h => !h.archived).length} habits completed
              </p>
            </div>
          </div>
        </div>

        {/* Quote Card */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <p className="text-lg italic text-foreground leading-relaxed">
            "{quote}"
          </p>
          <p className="text-xs text-muted-foreground mt-4">Daily Inspiration</p>
        </div>

        {/* Streak Section */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame size={18} className="text-orange-500" />
              <span className="text-2xl font-bold text-foreground">0</span>
            </div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground mb-2">0</div>
            <p className="text-xs text-muted-foreground">Longest Streak</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground mb-2">0</div>
            <p className="text-xs text-muted-foreground">Perfect Days</p>
          </div>
        </div>

        {/* Habits Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Today's Habits</h2>
            <button
              onClick={handleAddHabit}
              className="bg-primary text-primary-foreground rounded-full p-2 hover:shadow-lg transition-shadow"
            >
              <Plus size={20} />
            </button>
          </div>
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
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

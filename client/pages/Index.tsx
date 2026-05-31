import { useEffect, useState } from 'react';
import { Habit, DailyRecord } from '@/types/habit';
import {
  habitStorage,
  recordStorage,
  initializeDefaultHabits,
} from '@/lib/storage';
import { getDailyQuote } from '@/lib/quotes';
import { CircleProgress } from '@/components/CircleProgress';
import { HabitCard } from '@/components/HabitCard';
import { BottomNav } from '@/components/BottomNav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AddHabitModal } from '@/components/AddHabitModal';
import { Plus, Flame, Zap } from 'lucide-react';

export default function Dashboard() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [streaks, setStreaks] = useState({ current: 0, longest: 0, perfect: 0 });
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    initializeDefaultHabits();
    const allHabits = habitStorage.getHabits();
    setHabits(allHabits);

    const todayRecord = recordStorage.getOrCreateTodayRecord(allHabits);
    setRecord(todayRecord);
    setQuote(getDailyQuote());

    // Calculate streaks
    const records = recordStorage.getRecords();
    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let perfectDays = 0;

    for (let i = sortedRecords.length - 1; i >= 0; i--) {
      if (sortedRecords[i].completionPercentage >= 100) {
        tempStreak++;
        perfectDays++;
        if (i === sortedRecords.length - 1) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    setStreaks({ current: currentStreak, longest: longestStreak, perfect: perfectDays });
  }, []);

  const handleToggleHabit = (habitId: string) => {
    if (!record) return;
    recordStorage.toggleHabit(record.id, habitId);
    const updatedRecord = recordStorage.getRecordForDate(record.date, habits);
    setRecord(updatedRecord);
  };

  const handleAddHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name: habitData.name,
      icon: habitData.icon,
      color: habitData.color,
      notes: habitData.notes,
      order: habitData.order,
      archived: false,
      createdAt: new Date().toISOString(),
    };

    habitStorage.addHabit(newHabit);
    const allHabits = habitStorage.getHabits();
    setHabits(allHabits);

    // Get today's record and sync with new habits
    const todayRecord = recordStorage.getOrCreateTodayRecord(allHabits);
    setRecord(todayRecord);
    setShowAddModal(false);
  };

  const completedCount = record?.habits.filter(h => h.completed).length || 0;
  const totalHabits = habits.filter(h => !h.archived).length;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              HabitFlow
            </h1>
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
        <div className="bg-gradient-to-br from-primary/15 via-secondary/15 to-accent/15 rounded-3xl p-8 border border-primary/30">
          <div className="flex flex-col items-center gap-6">
            <CircleProgress percentage={record?.completionPercentage || 0} />
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">Today's Score</p>
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Today's Habits</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full p-3 hover:shadow-lg transition-shadow active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
          {totalHabits === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-4">No habits yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Create Your First Habit
              </button>
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

      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddHabit}
      />

      <BottomNav />
    </div>
  );
}

import { useMemo } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { recordStorage, habitStorage } from '@/lib/storage';
import { Lock, Menu } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

interface AchievementsProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}

export default function Achievements({ mobileMenuOpen, setMobileMenuOpen }: AchievementsProps) {
  const records = recordStorage.getRecords();
  const habits = habitStorage.getHabits();

  const badges: Badge[] = useMemo(() => {
    const perfectDays = records.filter(
      r => r.completionPercentage === 100
    ).length;
    const nonArchivedHabits = habits.filter(h => !h.archived).length;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (let i = sortedRecords.length - 1; i >= 0; i--) {
      if (sortedRecords[i].completionPercentage >= 100) {
        tempStreak++;
        if (i === sortedRecords.length - 1) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    const totalHabitsCompleted = records.reduce(
      (sum, r) =>
        sum + r.habits.filter(h => h.completed).length * nonArchivedHabits,
      0
    );

    return [
      {
        id: '1',
        name: 'First Step',
        description: 'Complete your first habit',
        icon: '🚀',
        unlocked: records.some(r => r.habits.some(h => h.completed)),
      },
      {
        id: '2',
        name: 'Perfect Day',
        description: 'Complete all habits in a day',
        icon: '⭐',
        unlocked: perfectDays > 0,
      },
      {
        id: '3',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        unlocked: longestStreak >= 7,
      },
      {
        id: '4',
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: '👑',
        unlocked: longestStreak >= 30,
      },
      {
        id: '5',
        name: 'Century Club',
        description: 'Achieve 100 perfect days',
        icon: '💯',
        unlocked: perfectDays >= 100,
      },
      {
        id: '6',
        name: 'Consistency Champion',
        description: 'Maintain 90%+ completion for 14 days',
        icon: '🏆',
        unlocked:
          sortedRecords.length >= 14 &&
          sortedRecords
            .slice(-14)
            .every(r => r.completionPercentage >= 90),
      },
      {
        id: '7',
        name: 'Habit Collector',
        description: 'Create 10 habits',
        icon: '🎯',
        unlocked: nonArchivedHabits >= 10,
      },
      {
        id: '8',
        name: 'Daily Devotee',
        description: 'Track for 50 days',
        icon: '📅',
        unlocked: records.length >= 50,
      },
      {
        id: '9',
        name: 'Year in Review',
        description: 'Track for 365 days',
        icon: '🎊',
        unlocked: records.length >= 365,
      },
      {
        id: '10',
        name: 'Unstoppable',
        description: 'Maintain a 100-day streak',
        icon: '⚡',
        unlocked: longestStreak >= 100,
      },
    ];
  }, [records, habits]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Progress */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Badges Collected
              </h2>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} of {totalCount}
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary to-secondary rounded-full h-3 transition-all"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Unlocked Badges */}
        {badges.filter(b => b.unlocked).length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Unlocked</h2>
            <div className="grid grid-cols-3 gap-4">
              {badges
                .filter(b => b.unlocked)
                .map(badge => (
                  <div
                    key={badge.id}
                    className="bg-card border border-primary/30 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
                  >
                    <div className="text-5xl mb-3">{badge.icon}</div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {badges.filter(b => !b.unlocked).length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Locked</h2>
            <div className="grid grid-cols-3 gap-4">
              {badges
                .filter(b => !b.unlocked)
                .map(badge => (
                  <div
                    key={badge.id}
                    className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center opacity-60 relative"
                  >
                    <div className="absolute top-2 right-2">
                      <Lock size={16} className="text-muted-foreground" />
                    </div>
                    <div className="text-5xl mb-3 grayscale">{badge.icon}</div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-2xl font-bold text-primary mb-2">
                {records.filter(r => r.completionPercentage === 100).length}
              </div>
              <p className="text-sm text-muted-foreground">Perfect Days</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-2xl font-bold text-secondary mb-2">
                {records.length}
              </div>
              <p className="text-sm text-muted-foreground">Days Tracked</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-2xl font-bold text-accent mb-2">
                {habits.filter(h => !h.archived).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Habits</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-2xl font-bold text-green-500 mb-2">
                {unlockedCount}
              </div>
              <p className="text-sm text-muted-foreground">Achievements</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

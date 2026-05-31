import { useMemo } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { recordStorage, habitStorage } from '@/lib/storage';
import { TrendingUp, TrendingDown, Minus, Menu } from 'lucide-react';

interface ReportsProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}

export default function Reports({ mobileMenuOpen, setMobileMenuOpen }: ReportsProps) {
  const records = recordStorage.getRecords();
  const habits = habitStorage.getHabits().filter(h => !h.archived);

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        averageCompletion: 0,
        currentStreak: 0,
        longestStreak: 0,
        perfectDays: 0,
        bestDay: 'N/A',
        weekAverage: 0,
        monthAverage: 0,
        trend: 'stable',
      };
    }

    const sortedRecords = [...records].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const averageCompletion =
      sortedRecords.reduce((sum, r) => sum + r.completionPercentage, 0) /
      records.length;
    const perfectDays = records.filter(
      r => r.completionPercentage === 100
    ).length;

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = sortedRecords.length - 1; i >= 0; i--) {
      const recordDate = new Date(sortedRecords[i].date);
      recordDate.setHours(0, 0, 0, 0);

      if (sortedRecords[i].completionPercentage >= 100) {
        tempStreak++;
        const expectedDate = new Date(today);
        expectedDate.setDate(
          expectedDate.getDate() - (sortedRecords.length - 1 - i)
        );
        if (i === sortedRecords.length - 1 || i === sortedRecords.length - 2) {
          currentStreak = tempStreak;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Get best day of week
    const dayCompletions: { [key: string]: number[] } = {
      Sunday: [],
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
    };
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    records.forEach(r => {
      const day = dayNames[new Date(r.date).getDay()];
      dayCompletions[day].push(r.completionPercentage);
    });

    let bestDay = 'N/A';
    let bestAverage = 0;
    Object.entries(dayCompletions).forEach(([day, values]) => {
      if (values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        if (avg > bestAverage) {
          bestAverage = avg;
          bestDay = day;
        }
      }
    });

    // Week and month averages
    const weekAverage =
      sortedRecords.length >= 7
        ? sortedRecords
            .slice(-7)
            .reduce((sum, r) => sum + r.completionPercentage, 0) / 7
        : averageCompletion;

    const monthAverage =
      sortedRecords.length >= 30
        ? sortedRecords
            .slice(-30)
            .reduce((sum, r) => sum + r.completionPercentage, 0) / 30
        : averageCompletion;

    // Trend analysis
    let trend = 'stable';
    if (sortedRecords.length >= 7) {
      const recentWeek = sortedRecords.slice(-7);
      const previousWeek = sortedRecords.slice(-14, -7);
      if (previousWeek.length > 0) {
        const recentAvg =
          recentWeek.reduce((sum, r) => sum + r.completionPercentage, 0) /
          recentWeek.length;
        const previousAvg =
          previousWeek.reduce((sum, r) => sum + r.completionPercentage, 0) /
          previousWeek.length;
        if (recentAvg > previousAvg + 5) trend = 'improving';
        else if (recentAvg < previousAvg - 5) trend = 'declining';
      }
    }

    return {
      averageCompletion: Math.round(averageCompletion),
      currentStreak,
      longestStreak,
      perfectDays,
      bestDay,
      weekAverage: Math.round(weekAverage),
      monthAverage: Math.round(monthAverage),
      trend,
    };
  }, [records]);

  const habitStats = useMemo(() => {
    return habits.map(habit => {
      const completions = records
        .flatMap(r => r.habits)
        .filter(h => h.habitId === habit.id && h.completed).length;
      const totalRecords = records.length;
      const successRate =
        totalRecords > 0 ? Math.round((completions / totalRecords) * 100) : 0;
      return { ...habit, successRate, completions };
    });
  }, [habits, records]);

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
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Overall Stats */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Overall Performance
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {stats.averageCompletion}%
              </div>
              <p className="text-sm text-muted-foreground">
                Average Completion
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-3xl font-bold text-secondary mb-2">
                {stats.currentStreak}
              </div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-3xl font-bold text-accent mb-2">
                {stats.longestStreak}
              </div>
              <p className="text-sm text-muted-foreground">Longest Streak</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {stats.perfectDays}
              </div>
              <p className="text-sm text-muted-foreground">Perfect Days</p>
            </div>
          </div>
        </div>

        {/* Time Period Stats */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Time Period</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {stats.weekAverage}%
              </div>
              <p className="text-sm text-muted-foreground">
                Last 7 Days Average
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="text-3xl font-bold text-indigo-500 mb-2">
                {stats.monthAverage}%
              </div>
              <p className="text-sm text-muted-foreground">
                Last 30 Days Average
              </p>
            </div>
          </div>
        </div>

        {/* Trend & Best Day */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              {stats.trend === 'improving' && (
                <TrendingUp className="text-green-500" size={24} />
              )}
              {stats.trend === 'declining' && (
                <TrendingDown className="text-red-500" size={24} />
              )}
              {stats.trend === 'stable' && (
                <Minus className="text-yellow-500" size={24} />
              )}
              <div>
                <p className="font-semibold text-foreground capitalize">
                  {stats.trend}
                </p>
                <p className="text-xs text-muted-foreground">Trend</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-foreground font-semibold mb-1">
              {stats.bestDay}
            </div>
            <p className="text-sm text-muted-foreground">Your Best Day</p>
          </div>
        </div>

        {/* Habit Performance */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Habit Performance
          </h2>
          <div className="space-y-4">
            {habitStats
              .sort((a, b) => b.successRate - a.successRate)
              .map(habit => (
                <div
                  key={habit.id}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{habit.icon}</span>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {habit.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {habit.completions} completions
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {habit.successRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Success Rate
                      </p>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary to-secondary rounded-full h-2 transition-all"
                      style={{ width: `${habit.successRate}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Insights */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Insights</h2>
          <div className="space-y-3">
            {(() => {
              const strongest = habitStats.reduce((a, b) =>
                a.successRate > b.successRate ? a : b
              );
              const weakest = habitStats.reduce((a, b) =>
                a.successRate < b.successRate ? a : b
              );
              return (
                <>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
                    <p className="text-foreground">
                      <span className="font-semibold">Strongest Habit:</span>{' '}
                      {strongest.name} ({strongest.successRate}%)
                    </p>
                  </div>
                  {weakest.successRate < 70 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
                      <p className="text-foreground">
                        <span className="font-semibold">Needs Attention:</span>{' '}
                        {weakest.name} ({weakest.successRate}%)
                      </p>
                    </div>
                  )}
                  <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
                    <p className="text-foreground">
                      You've completed{' '}
                      <span className="font-semibold">
                        {records.length} tracking days
                      </span>{' '}
                      with an average of{' '}
                      <span className="font-semibold">
                        {stats.averageCompletion}%
                      </span>{' '}
                      daily completion.
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

    </div>
  );
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  notes?: string;
  order: number;
  archived: boolean;
  createdAt: string;
}

export interface DailyRecord {
  id: string;
  date: string;
  habits: HabitCompletion[];
  completionPercentage: number;
}

export interface HabitCompletion {
  habitId: string;
  completed: boolean;
  completedAt?: string;
}

export interface Streak {
  habitId: string;
  current: number;
  longest: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: (stats: any) => boolean;
}

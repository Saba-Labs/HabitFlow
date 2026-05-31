import { Habit, DailyRecord } from '@/types/habit';

const HABITS_KEY = 'habitflow_habits';
const RECORDS_KEY = 'habitflow_records';

export const habitStorage = {
  getHabits: (): Habit[] => {
    try {
      const data = localStorage.getItem(HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHabits: (habits: Habit[]) => {
    localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  },

  addHabit: (habit: Habit) => {
    const habits = habitStorage.getHabits();
    habits.push(habit);
    habitStorage.saveHabits(habits);
    return habit;
  },

  updateHabit: (id: string, updates: Partial<Habit>) => {
    const habits = habitStorage.getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index >= 0) {
      habits[index] = { ...habits[index], ...updates };
      habitStorage.saveHabits(habits);
    }
  },

  deleteHabit: (id: string) => {
    const habits = habitStorage.getHabits();
    const filtered = habits.filter(h => h.id !== id);
    habitStorage.saveHabits(filtered);
  },

  reorderHabits: (habits: Habit[]) => {
    habitStorage.saveHabits(habits);
  },
};

export const recordStorage = {
  getRecords: (): DailyRecord[] => {
    try {
      const data = localStorage.getItem(RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRecords: (records: DailyRecord[]) => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  },

  getOrCreateTodayRecord: (habits: Habit[]): DailyRecord => {
    const records = recordStorage.getRecords();
    const today = new Date().toISOString().split('T')[0];
    let record = records.find(r => r.date === today);

    const activeHabits = habits.filter(h => !h.archived);

    if (!record) {
      record = {
        id: `record_${today}`,
        date: today,
        habits: activeHabits.map(h => ({ habitId: h.id, completed: false })),
        completionPercentage: 0,
      };
      records.push(record);
      recordStorage.saveRecords(records);
    } else {
      // Add any new habits that aren't in the record yet
      const existingHabitIds = record.habits.map(h => h.habitId);
      const newHabits = activeHabits.filter(h => !existingHabitIds.includes(h.id));

      if (newHabits.length > 0) {
        record.habits.push(...newHabits.map(h => ({ habitId: h.id, completed: false })));
        record.completionPercentage = calculateCompletion(record.habits);
        recordStorage.saveRecords(records);
      }
    }

    return record;
  },

  getRecordForDate: (date: string, habits: Habit[]): DailyRecord => {
    const records = recordStorage.getRecords();
    let record = records.find(r => r.date === date);

    if (!record) {
      record = {
        id: `record_${date}`,
        date,
        habits: habits
          .filter(h => !h.archived)
          .map(h => ({ habitId: h.id, completed: false })),
        completionPercentage: 0,
      };
      records.push(record);
      recordStorage.saveRecords(records);
    }

    return record;
  },

  updateRecord: (record: DailyRecord) => {
    const records = recordStorage.getRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
    } else {
      records.push(record);
    }
    recordStorage.saveRecords(records);
  },

  toggleHabit: (recordId: string, habitId: string) => {
    const records = recordStorage.getRecords();
    const record = records.find(r => r.id === recordId);
    if (record) {
      const habitCompletion = record.habits.find(h => h.habitId === habitId);
      if (habitCompletion) {
        habitCompletion.completed = !habitCompletion.completed;
        habitCompletion.completedAt = habitCompletion.completed
          ? new Date().toISOString()
          : undefined;
        record.completionPercentage = calculateCompletion(record.habits);
        recordStorage.saveRecords(records);
      }
    }
  },
};

export const calculateCompletion = (habits: any[]): number => {
  if (habits.length === 0) return 0;
  const completed = habits.filter(h => h.completed).length;
  return Math.round((completed / habits.length) * 100);
};

export const initializeDefaultHabits = () => {
  const existing = habitStorage.getHabits();
  if (existing.length > 0) return;

  const defaultHabits: Habit[] = [
    {
      id: 'habit_1',
      name: 'Drink Enough Water',
      icon: '💧',
      color: 'bg-blue-500',
      order: 0,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit_2',
      name: 'Wake Up Early',
      icon: '🌅',
      color: 'bg-orange-500',
      order: 1,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit_3',
      name: 'Yoga / Exercise',
      icon: '🧘',
      color: 'bg-green-500',
      order: 2,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit_4',
      name: 'Eat Fruits',
      icon: '🍎',
      color: 'bg-red-500',
      order: 3,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'habit_5',
      name: 'No Excess Mobile Usage',
      icon: '📱',
      color: 'bg-purple-500',
      order: 4,
      archived: false,
      createdAt: new Date().toISOString(),
    },
  ];

  habitStorage.saveHabits(defaultHabits);
};

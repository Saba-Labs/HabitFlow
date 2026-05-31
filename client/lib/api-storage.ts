import { Habit, DailyRecord } from '@/types/habit';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const apiHabitStorage = {
  getHabits: async (): Promise<Habit[]> => {
    try {
      return await fetchApi<Habit[]>('/habits');
    } catch (err) {
      console.error('Failed to fetch habits:', err);
      return [];
    }
  },

  addHabit: async (habit: Habit): Promise<Habit> => {
    return fetchApi<Habit>('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    });
  },

  updateHabit: async (
    habitId: string,
    updates: Partial<Habit>
  ): Promise<Habit> => {
    return fetchApi<Habit>(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteHabit: async (habitId: string): Promise<void> => {
    await fetchApi(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  },
};

export const apiRecordStorage = {
  getTodayRecord: async (habits: Habit[]): Promise<DailyRecord> => {
    try {
      const record = await fetchApi<DailyRecord>('/records/today');
      return record;
    } catch (err) {
      console.error('Failed to fetch today record:', err);
      const today = new Date().toISOString().split('T')[0];
      return {
        id: `record_${today}`,
        date: today,
        habits: habits.map(h => ({ habitId: h.id, completed: false })),
        completionPercentage: 0,
      };
    }
  },

  toggleHabit: async (recordId: string, habitId: string): Promise<void> => {
    await fetchApi(`/records/${recordId}/habits/${habitId}`, {
      method: 'PUT',
    });
  },
};

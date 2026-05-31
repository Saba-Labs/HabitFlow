// Simple in-memory store for development when database is not available
interface StoredHabit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  notes?: string;
  order: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface StoredRecord {
  id: string;
  user_id: string;
  date: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

interface StoredCompletion {
  id: string;
  record_id: string;
  habit_id: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

class MemoryStore {
  private habits: StoredHabit[] = [];
  private records: StoredRecord[] = [];
  private completions: StoredCompletion[] = [];

  // Habits
  getHabits(userId: string) {
    return this.habits.filter(h => h.user_id === userId && !h.archived);
  }

  insertHabit(habit: StoredHabit) {
    this.habits.push(habit);
    return habit;
  }

  updateHabit(habitId: string, updates: Partial<StoredHabit>) {
    const habit = this.habits.find(h => h.id === habitId);
    if (habit) {
      Object.assign(habit, updates, { updated_at: new Date().toISOString() });
    }
    return habit;
  }

  deleteHabit(habitId: string) {
    const index = this.habits.findIndex(h => h.id === habitId);
    if (index >= 0) {
      this.habits.splice(index, 1);
      return true;
    }
    return false;
  }

  // Records
  getRecord(userId: string, date: string) {
    return this.records.find(r => r.user_id === userId && r.date === date);
  }

  insertRecord(record: StoredRecord) {
    this.records.push(record);
    return record;
  }

  updateRecord(recordId: string, updates: Partial<StoredRecord>) {
    const record = this.records.find(r => r.id === recordId);
    if (record) {
      Object.assign(record, updates, { updated_at: new Date().toISOString() });
    }
    return record;
  }

  // Completions
  getCompletions(recordId: string) {
    return this.completions.filter(c => c.record_id === recordId);
  }

  getCompletion(recordId: string, habitId: string) {
    return this.completions.find(c => c.record_id === recordId && c.habit_id === habitId);
  }

  insertCompletion(completion: StoredCompletion) {
    this.completions.push(completion);
    return completion;
  }

  updateCompletion(recordId: string, habitId: string, updates: Partial<StoredCompletion>) {
    const completion = this.completions.find(c => c.record_id === recordId && c.habit_id === habitId);
    if (completion) {
      Object.assign(completion, updates, { updated_at: new Date().toISOString() });
    }
    return completion;
  }

  deleteCompletionsForRecord(recordId: string) {
    const before = this.completions.length;
    this.completions = this.completions.filter(c => c.record_id !== recordId);
    return before - this.completions.length;
  }

  getCompletionStats(recordId: string) {
    const comps = this.getCompletions(recordId);
    const completed = comps.filter(c => c.completed).length;
    const total = comps.length;
    return { total, completed };
  }
}

export const memoryStore = new MemoryStore();

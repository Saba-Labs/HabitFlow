import { useEffect, useState } from 'react';
import { Habit } from '@/types/habit';
import { habitStorage, initializeDefaultHabits, recordStorage } from '@/lib/storage';
import { AddHabitModal } from '@/components/AddHabitModal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    initializeDefaultHabits();
    const allHabits = habitStorage.getHabits();
    setHabits(allHabits.filter(h => !h.archived));
  }, []);

  const handleAddHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    if (editingHabit) {
      habitStorage.updateHabit(editingHabit.id, {
        name: habitData.name,
        icon: habitData.icon,
        color: habitData.color,
        notes: habitData.notes,
      });
      setEditingHabit(null);
    } else {
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
    }

    const allHabits = habitStorage.getHabits();
    setHabits(allHabits.filter(h => !h.archived));
    setShowAddModal(false);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setShowAddModal(true);
  };

  const handleDeleteHabit = (habitId: string) => {
    habitStorage.deleteHabit(habitId);
    const allHabits = habitStorage.getHabits();
    setHabits(allHabits.filter(h => !h.archived));
  };

  return (
    <div className="min-h-screen pb-8 bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              My Habits
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Manage and customize your daily habits
            </p>
          </div>
          <button
            onClick={() => {
              setEditingHabit(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-full p-3 hover:shadow-lg transition-shadow active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Habits List */}
        <div className="space-y-3">
          {habits.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground mb-4">No habits yet</p>
              <button
                onClick={() => {
                  setEditingHabit(null);
                  setShowAddModal(true);
                }}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:shadow-lg transition-shadow"
              >
                Create Your First Habit
              </button>
            </div>
          ) : (
            habits.map(habit => (
              <div
                key={habit.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl">{habit.icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-foreground">
                    {habit.name}
                  </h3>
                  {habit.notes && (
                    <p className="text-sm text-muted-foreground">{habit.notes}</p>
                  )}
                </div>
                <div className={`w-4 h-4 rounded-full ${habit.color}`} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditHabit(habit)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit habit"
                  >
                    <Edit2 size={18} className="text-muted-foreground hover:text-foreground" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${habit.name}"?`)) {
                        handleDeleteHabit(habit.id);
                      }
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 size={18} className="text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingHabit(null);
        }}
        onSave={handleAddHabit}
        initialHabit={editingHabit || undefined}
      />
    </div>
  );
}

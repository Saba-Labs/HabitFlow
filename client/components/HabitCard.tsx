import { Habit, HabitCompletion } from '@/types/habit';
import { CheckCircle2, Circle } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  completion: HabitCompletion;
  onToggle: (habitId: string) => void;
  onEdit?: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
}

export const HabitCard = ({
  habit,
  completion,
  onToggle,
}: HabitCardProps) => {
  return (
    <div className={`bg-card border rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg ${
      completion.completed
        ? 'border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5'
        : 'border-border'
    }`}>
      <div className="text-4xl">{habit.icon}</div>
      <div className="flex-1">
        <h3 className={`font-semibold text-lg ${completion.completed ? 'text-primary' : 'text-foreground'}`}>
          {habit.name}
        </h3>
        {habit.notes && (
          <p className="text-sm text-muted-foreground">{habit.notes}</p>
        )}
        {completion.completedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            ✓ Completed at {new Date(completion.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      <button
        onClick={() => onToggle(habit.id)}
        className="transition-transform hover:scale-110 active:scale-95"
      >
        {completion.completed ? (
          <CheckCircle2
            size={32}
            className="text-primary fill-primary"
          />
        ) : (
          <Circle size={32} className="text-muted-foreground hover:text-primary" />
        )}
      </button>
    </div>
  );
};

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
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-lg">
      <div className="text-4xl">{habit.icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-lg">{habit.name}</h3>
        {habit.notes && (
          <p className="text-sm text-muted-foreground">{habit.notes}</p>
        )}
      </div>
      <button
        onClick={() => onToggle(habit.id)}
        className="transition-transform hover:scale-110"
      >
        {completion.completed ? (
          <CheckCircle2
            size={32}
            className="text-primary fill-primary"
          />
        ) : (
          <Circle size={32} className="text-muted-foreground" />
        )}
      </button>
    </div>
  );
};

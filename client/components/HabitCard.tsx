import { motion, AnimatePresence } from 'framer-motion';
import { Habit, HabitCompletion } from '@/types/habit';
import { HabitToggle } from '@/components/HabitToggle';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  habit: Habit;
  completion: HabitCompletion;
  onToggle: (habitId: string) => void;
  pending?: boolean;
}

export const HabitCard = ({
  habit,
  completion,
  onToggle,
  pending = false,
}: HabitCardProps) => {
  const completed = completion.completed;

  return (
    <motion.div
      layout
      initial={false}
      transition={{ layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } }}
      className={cn(
        'bg-card border border-border rounded-xl p-4 flex items-center gap-4',
        'hover:border-foreground/15 transition-colors duration-200',
        completed && 'bg-muted/30',
      )}
    >
      <span className="text-3xl select-none leading-none" aria-hidden>
        {habit.icon}
      </span>

      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            'font-medium text-base truncate text-foreground',
            completed && 'text-muted-foreground line-through decoration-border',
          )}
        >
          {habit.name}
        </h3>
        {habit.notes && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">{habit.notes}</p>
        )}
        <AnimatePresence mode="wait">
          {completion.completedAt && (
            <motion.p
              key={completion.completedAt}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="text-xs text-muted-foreground mt-1"
            >
              {new Date(completion.completedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <HabitToggle
        completed={completed}
        onToggle={() => onToggle(habit.id)}
        pending={pending}
      />
    </motion.div>
  );
};

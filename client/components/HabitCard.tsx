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
      animate={{
        borderColor: completed ? 'hsl(var(--primary) / 0.45)' : 'hsl(var(--border))',
      }}
      transition={{
        layout: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
        borderColor: { duration: 0.22 },
      }}
      className={cn(
        'bg-card border rounded-2xl p-5 flex items-center gap-4',
        'transition-shadow duration-300 hover:shadow-lg',
        completed && 'bg-gradient-to-r from-primary/5 to-secondary/5',
      )}
    >
      <motion.span
        className="text-4xl select-none"
        animate={{ scale: completed ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        {habit.icon}
      </motion.span>

      <div className="flex-1 min-w-0">
        <motion.h3
          className={cn(
            'font-semibold text-lg truncate',
            completed ? 'text-primary' : 'text-foreground',
          )}
          animate={{ opacity: completed ? 1 : 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {habit.name}
        </motion.h3>
        {habit.notes && (
          <p className="text-sm text-muted-foreground truncate">{habit.notes}</p>
        )}
        <AnimatePresence mode="wait">
          {completion.completedAt && (
            <motion.p
              key={completion.completedAt}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-muted-foreground mt-1"
            >
              ✓ Completed at{' '}
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

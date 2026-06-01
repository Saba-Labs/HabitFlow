import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitToggleProps {
  completed: boolean;
  onToggle: () => void;
  pending?: boolean;
  disabled?: boolean;
}

const spring = { type: 'spring' as const, stiffness: 480, damping: 34, mass: 0.75 };

export function HabitToggle({
  completed,
  onToggle,
  pending = false,
  disabled = false,
}: HabitToggleProps) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      disabled={disabled || pending}
      aria-pressed={completed}
      aria-busy={pending}
      aria-label={completed ? 'Mark habit incomplete' : 'Mark habit complete'}
      className={cn(
        'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        (disabled || pending) && 'pointer-events-none opacity-60',
      )}
      whileTap={disabled || pending ? undefined : { scale: 0.94 }}
      transition={spring}
    >
      <motion.span
        className="absolute inset-0 rounded-full border-[1.5px] border-border bg-background"
        initial={false}
        animate={{
          borderColor: completed ? 'hsl(var(--foreground))' : 'hsl(var(--border))',
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      />

      <motion.span
        className="absolute inset-[3px] rounded-full bg-foreground"
        initial={false}
        animate={{
          scale: completed ? 1 : 0,
          opacity: completed ? 1 : 0,
        }}
        transition={spring}
        style={{ transformOrigin: 'center' }}
      />

      <AnimatePresence mode="popLayout">
        {completed && (
          <motion.span
            key="check"
            className="relative z-10 flex items-center justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <Check className="h-4 w-4 text-background" strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>

      {pending && (
        <motion.span
          className="absolute inset-0 rounded-full border border-border"
          animate={{ opacity: [0.4, 0.15, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
}

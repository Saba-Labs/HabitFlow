import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitToggleProps {
  completed: boolean;
  onToggle: () => void;
  pending?: boolean;
  disabled?: boolean;
}

const spring = { type: 'spring' as const, stiffness: 520, damping: 32, mass: 0.8 };

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
        'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        (disabled || pending) && 'pointer-events-none opacity-70',
      )}
      whileTap={disabled || pending ? undefined : { scale: 0.9 }}
      transition={spring}
    >
      {/* Soft glow when completed */}
      <AnimatePresence>
        {completed && (
          <motion.span
            className="absolute inset-0 rounded-full bg-primary/25"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.35, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </AnimatePresence>

      {/* Track ring */}
      <motion.span
        className="absolute inset-0 rounded-full border-2"
        initial={false}
        animate={{
          borderColor: completed
            ? 'hsl(var(--primary))'
            : 'hsl(var(--muted-foreground) / 0.35)',
          scale: completed ? 1 : 1,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      />

      {/* Fill */}
      <motion.span
        className="absolute inset-[3px] rounded-full"
        initial={false}
        animate={{
          scale: completed ? 1 : 0,
          opacity: completed ? 1 : 0,
          background: completed
            ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))'
            : 'transparent',
        }}
        transition={spring}
        style={{ transformOrigin: 'center' }}
      />

      {/* Check */}
      <AnimatePresence mode="popLayout">
        {completed && (
          <motion.span
            key="check"
            className="relative z-10 flex items-center justify-center"
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ ...spring, delay: 0.02 }}
          >
            <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pending pulse */}
      {pending && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </motion.button>
  );
}

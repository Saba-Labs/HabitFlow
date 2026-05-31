import { useState } from 'react';
import { Habit } from '@/types/habit';
import { X } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  initialHabit?: Partial<Habit>;
}

const EMOJI_SUGGESTIONS = [
  '💧', '🌅', '🧘', '🍎', '📱', '⭐', '🏃', '📚', '💪', '🧠',
  '🎯', '🏆', '🔥', '😴', '🥗', '💻', '🎨', '🚴', '🏊', '🧩',
  '🌳', '🎵', '🏅', '✈️', '🎬', '🍕', '☕', '🌙', '☀️', '💝',
];

const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-cyan-500',
];

export const AddHabitModal = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}: AddHabitModalProps) => {
  const [name, setName] = useState(initialHabit?.name || '');
  const [icon, setIcon] = useState(initialHabit?.icon || '⭐');
  const [color, setColor] = useState(initialHabit?.color || 'bg-blue-500');
  const [notes, setNotes] = useState(initialHabit?.notes || '');
  const [customEmoji, setCustomEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a habit name');
      return;
    }

    onSave({
      name: name.trim(),
      icon,
      color,
      notes: notes.trim(),
      order: initialHabit?.order || 0,
    });

    // Reset form
    setName('');
    setIcon('⭐');
    setColor('bg-blue-500');
    setNotes('');
    setCustomEmoji('');
    setShowEmojiPicker(false);
    onClose();
  };

  const handleEmojiSelect = (emoji: string) => {
    setIcon(emoji);
    setShowEmojiPicker(false);
  };

  const handleCustomEmoji = () => {
    if (customEmoji.trim()) {
      setIcon(customEmoji.trim().charAt(0));
      setCustomEmoji('');
      setShowEmojiPicker(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 sm:items-center sm:justify-center">
      <div className="bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {initialHabit?.id ? 'Edit Habit' : 'Add New Habit'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Habit Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Habit Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Morning Meditation"
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Icon / Emoji
          </label>
          <div className="space-y-3">
            {/* Current Selection */}
            <div className="flex items-center gap-4 bg-muted p-4 rounded-lg">
              <div className="text-5xl">{icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">Selected Icon</p>
                <p className="font-semibold text-foreground">{icon}</p>
              </div>
            </div>

            {/* Toggle Picker */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-3 font-semibold hover:shadow-lg transition-shadow"
            >
              {showEmojiPicker ? 'Hide Picker' : 'Choose Emoji'}
            </button>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="space-y-3 bg-muted p-4 rounded-lg">
                {/* Suggestions Grid */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">
                    SUGGESTED
                  </p>
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_SUGGESTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleEmojiSelect(emoji)}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          icon === emoji
                            ? 'bg-primary/20 ring-2 ring-primary'
                            : 'hover:bg-background'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Emoji Input */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-semibold">
                    CUSTOM
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customEmoji}
                      onChange={(e) => setCustomEmoji(e.target.value)}
                      placeholder="Paste emoji"
                      maxLength={2}
                      className="flex-1 bg-background border border-border rounded px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={handleCustomEmoji}
                      className="bg-secondary text-secondary-foreground px-4 py-2 rounded font-semibold hover:shadow-lg transition-shadow"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Color Selection */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">
            Color Theme
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`aspect-square rounded-lg transition-all ${c} ${
                  color === c ? 'ring-2 ring-foreground scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or reminders for this habit..."
            rows={3}
            className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-muted text-foreground rounded-lg px-4 py-3 font-semibold hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg px-4 py-3 font-semibold hover:shadow-lg transition-shadow"
          >
            Save Habit
          </button>
        </div>
      </div>
    </div>
  );
};

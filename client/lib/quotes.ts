const quotes = [
  "Small daily improvements lead to remarkable results.",
  "Success is the sum of small efforts repeated day in and day out.",
  "You don't have to be great to start, but you have to start to be great.",
  "The secret of getting ahead is getting started.",
  "Every expert was once a beginner.",
  "Discipline is choosing between what you want now and what you want most.",
  "Progress, not perfection.",
  "The only way to do great work is to love what you do.",
  "Consistency is the key to success.",
  "Your habits shape your future.",
  "One day at a time, one habit at a time.",
  "The best time to start was yesterday. The second best is now.",
  "You are not what you think you are; you are what you do.",
  "Small steps lead to big changes.",
  "The habit of exercise is the foundation of good health.",
];

export const getDailyQuote = (): string => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return quotes[dayOfYear % quotes.length];
};

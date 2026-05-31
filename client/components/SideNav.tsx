import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, ListTodo, BarChart3, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SideNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/habits', icon: ListTodo, label: 'Habits' },
    { path: '/calendar', icon: BarChart3, label: 'Calendar' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-40 hidden sm:flex">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          HabitFlow
        </h1>
      </div>

      {/* Nav Items */}
      <div className="flex-1 p-4 space-y-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              location.pathname === path
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-muted'
            )}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border text-xs text-muted-foreground text-center">
        <p>HabitFlow © 2026</p>
      </div>
    </nav>
  );
};

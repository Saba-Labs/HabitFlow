import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, BarChart3, Trophy, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export const BottomNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/achievements', icon: Trophy, label: 'Achievements' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border h-20 flex items-center justify-around px-4 z-50">
      {navItems.map(({ path, icon: Icon, label }) => (
        <Link
          key={path}
          to={path}
          className={cn(
            'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all',
            location.pathname === path
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon size={24} />
          <span className="text-xs font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  );
};

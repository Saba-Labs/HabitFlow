import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth-context';
import { recordStorage, habitStorage } from '@/lib/storage';
import {
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Menu,
  LogOut,
} from 'lucide-react';
import { useMobileMenu } from '@/lib/mobile-menu-context';

export default function Settings() {
  const { mobileMenuOpen, setMobileMenuOpen } = useMobileMenu();
  const [copied, setCopied] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExportData = () => {
    const habits = habitStorage.getHabits();
    const records = recordStorage.getRecords();
    const data = { habits, records, exportDate: new Date().toISOString() };
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habitflow_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          try {
            const data = JSON.parse(event.target.result);
            if (data.habits && data.records) {
              habitStorage.saveHabits(data.habits);
              recordStorage.saveRecords(data.records);
              alert('Data imported successfully! Please refresh the page.');
              window.location.reload();
            }
          } catch (error) {
            alert('Error importing file. Please ensure it is a valid backup.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCopyBackup = () => {
    const habits = habitStorage.getHabits();
    const records = recordStorage.getRecords();
    const data = { habits, records, exportDate: new Date().toISOString() };
    const dataStr = JSON.stringify(data);
    navigator.clipboard.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetData = () => {
    habitStorage.saveHabits([]);
    recordStorage.saveRecords([]);
    setShowConfirmReset(false);
    alert('All data has been reset. Please refresh the page.');
    window.location.reload();
  };

  const stats = {
    totalHabits: habitStorage.getHabits().length,
    activeHabits: habitStorage.getHabits().filter(h => !h.archived).length,
    totalRecords: recordStorage.getRecords().length,
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 hover:bg-muted rounded-lg transition-colors text-foreground"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Data Stats */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Data Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {stats.totalHabits}
              </div>
              <p className="text-xs text-muted-foreground">Total Habits</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">
                {stats.activeHabits}
              </div>
              <p className="text-xs text-muted-foreground">Active Habits</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {stats.totalRecords}
              </div>
              <p className="text-xs text-muted-foreground">Records</p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Data Management
          </h2>
          <div className="space-y-4">
            {/* Export */}
            <button
              onClick={handleExportData}
              className="w-full bg-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:bg-muted transition-colors text-left"
            >
              <Download
                size={24}
                className="text-primary flex-shrink-0"
              />
              <div>
                <h3 className="font-semibold text-foreground">Export Data</h3>
                <p className="text-sm text-muted-foreground">
                  Download your habits and records as a JSON file
                </p>
              </div>
            </button>

            {/* Import */}
            <button
              onClick={handleImportData}
              className="w-full bg-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:bg-muted transition-colors text-left"
            >
              <Upload
                size={24}
                className="text-secondary flex-shrink-0"
              />
              <div>
                <h3 className="font-semibold text-foreground">Import Data</h3>
                <p className="text-sm text-muted-foreground">
                  Restore your data from a backup file
                </p>
              </div>
            </button>

            {/* Copy Backup */}
            <button
              onClick={handleCopyBackup}
              className="w-full bg-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:bg-muted transition-colors text-left"
            >
              {copied ? (
                <Check size={24} className="text-green-500 flex-shrink-0" />
              ) : (
                <Copy size={24} className="text-accent flex-shrink-0" />
              )}
              <div>
                <h3 className="font-semibold text-foreground">
                  {copied ? 'Copied!' : 'Copy Backup'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Copy your data to clipboard for safe storage
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Danger Zone
          </h2>
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-4 hover:bg-red-500/15 transition-colors text-left"
            >
              <Trash2 size={24} className="text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground">Reset All Data</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete all habits and records
                </p>
              </div>
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    Are you sure?
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This action cannot be undone. All your habits and tracking
                    records will be permanently deleted.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="flex-1 bg-card border border-border rounded-lg px-4 py-3 font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetData}
                  className="flex-1 bg-red-500 text-white rounded-lg px-4 py-3 font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Account</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-card border border-border rounded-2xl p-6 flex items-center gap-4 hover:bg-red-50 dark:hover:bg-red-950 transition-colors text-left text-red-600"
          >
            <LogOut size={24} className="flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Sign Out</h3>
              <p className="text-sm text-red-500">Log out from your account</p>
            </div>
          </button>
        </div>

        {/* About */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">App Name</p>
              <p className="font-semibold text-foreground">HabitFlow</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Version</p>
              <p className="font-semibold text-foreground">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Data Storage
              </p>
              <p className="font-semibold text-foreground">
                Local Storage (Browser)
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Last Updated
              </p>
              <p className="font-semibold text-foreground">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
          <p className="text-sm text-foreground">
            💡 All your data is stored locally in your browser. Make sure to
            export your data regularly as a backup.
          </p>
        </div>
      </div>

    </div>
  );
}

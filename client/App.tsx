import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SideNav } from "@/components/SideNav";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Habits from "./pages/Habits";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const InitTheme = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return <>{children}</>;
};

const AppContent = ({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen: boolean; setMobileMenuOpen: (value: boolean) => void }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && <SideNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Index mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /></ProtectedRoute>} />
        <Route path="/habits" element={<ProtectedRoute><Habits mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <InitTheme>
              <AppContent mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
            </InitTheme>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);

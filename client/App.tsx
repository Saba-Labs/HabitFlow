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
import { MobileMenuProvider, useMobileMenu } from "@/lib/mobile-menu-context";
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

const ProtectedLayout = ({ component }: { component: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const { mobileMenuOpen, setMobileMenuOpen } = useMobileMenu();

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

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <SideNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      {component}
    </>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedLayout component={<Index />} />} />
      <Route path="/habits" element={<ProtectedLayout component={<Habits />} />} />
      <Route path="/calendar" element={<ProtectedLayout component={<Calendar />} />} />
      <Route path="/reports" element={<ProtectedLayout component={<Reports />} />} />
      <Route path="/achievements" element={<ProtectedLayout component={<Achievements />} />} />
      <Route path="/settings" element={<ProtectedLayout component={<Settings />} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MobileMenuProvider>
              <InitTheme>
                <AppContent />
              </InitTheme>
            </MobileMenuProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);

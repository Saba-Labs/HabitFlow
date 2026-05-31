import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { SideNav } from "@/components/SideNav";
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

const AppContent = ({ mobileMenuOpen, setMobileMenuOpen }: { mobileMenuOpen: boolean; setMobileMenuOpen: (value: boolean) => void }) => (
  <>
    <SideNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    <Routes>
      <Route path="/" element={<Index mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />} />
      <Route path="/habits" element={<Habits mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />} />
      <Route path="/calendar" element={<Calendar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />} />
      <Route path="/reports" element={<Reports mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />} />
      <Route path="/achievements" element={<Achievements mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />} />
      <Route path="/settings" element={<Settings mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <InitTheme>
            <AppContent mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
          </InitTheme>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);

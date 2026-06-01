import { createContext, useContext, useMemo, useState } from 'react';

interface MobileMenuContextType {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (value: boolean) => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export const MobileMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const value = useMemo(() => ({ mobileMenuOpen, setMobileMenuOpen }), [mobileMenuOpen]);

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
    </MobileMenuContext.Provider>
  );
};

export const useMobileMenu = () => {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MobileMenuProvider');
  }
  return context;
};

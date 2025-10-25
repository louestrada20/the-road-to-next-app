"use client"

import { createContext, ReactNode,useContext, useState } from "react";

type MobileSidebarContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined);

export const MobileSidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <MobileSidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </MobileSidebarContext.Provider>
  );
};

export const useMobileSidebar = () => {
  const context = useContext(MobileSidebarContext);
  if (context === undefined) {
    throw new Error("useMobileSidebar must be used within a MobileSidebarProvider");
  }
  return context;
};

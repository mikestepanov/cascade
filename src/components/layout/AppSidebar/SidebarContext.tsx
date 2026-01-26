import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type SidebarState = "expanded" | "collapsed";

interface SidebarContextType {
  state: SidebarState;
  isMobile: boolean;
  isOpenMobile: boolean; // For mobile off-canvas
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = "nixelo_sidebar_state";
const MOBILE_BREAKPOINT = 768; // Matching Tailwind 'md'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from local storage or default to expanded
  const [state, setState] = useState<SidebarState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "expanded" || saved === "collapsed") {
        return saved;
      }
    }
    return "expanded";
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    return false;
  });
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Handle Resize for Mobile Detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpenMobile(false); // Close mobile menu if resizing up
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Persist state changes
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(STORAGE_KEY, state);
    }
  }, [state, isMobile]);

  // Keyboard shortcut `[` to toggle
  const toggleMobileMenu = useCallback(() => setIsOpenMobile((prev) => !prev), []);
  const closeMobileMenu = useCallback(() => setIsOpenMobile(false), []);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      toggleMobileMenu();
    } else {
      setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
    }
  }, [isMobile, toggleMobileMenu]);

  // Keyboard shortcut `[` to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isEditable = ["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable;
      if (e.key === "[" && !isEditable) {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // toggleSidebar moved up for useCallback

  const setSidebarState = (newState: SidebarState) => {
    setState(newState);
  };

  // Mobile menu handlers moved up

  return (
    <SidebarContext.Provider
      value={{
        state,
        isMobile,
        isOpenMobile,
        toggleSidebar,
        setSidebarState,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

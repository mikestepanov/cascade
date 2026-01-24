import React, { createContext, useContext, useEffect, useState } from "react";

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
      return (saved as SidebarState) || "expanded";
    }
    return "expanded";
  });

  const [isMobile, setIsMobile] = useState(false);
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "[" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, isMobile]); // Dependency on state/isMobile is minor, but accurate 

  const toggleSidebar = () => {
    if (isMobile) {
      toggleMobileMenu();
    } else {
      setState((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
    }
  };

  const setSidebarState = (newState: SidebarState) => {
    setState(newState);
  };

  const toggleMobileMenu = () => setIsOpenMobile((prev) => !prev);
  const closeMobileMenu = () => setIsOpenMobile(false);

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

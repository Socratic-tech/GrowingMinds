import { useState, useEffect } from "react";

export function useIsMobile() {
  // Fix: Use function to safely check window
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false; // Default to desktop during SSR
  });

  useEffect(() => {
    // Set initial value on mount
    setIsMobile(window.innerWidth < 768);

    // Listen for resize
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile;
}

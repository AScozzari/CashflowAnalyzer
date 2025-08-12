import { ReactNode, useRef, useEffect } from "react";
import { useLocation } from "wouter";

interface GestureNavigationProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
}

export function GestureNavigation({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className
}: GestureNavigationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startTime: number;
    const maxTime = 300; // Max time for a swipe gesture
    const minDistance = threshold;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      startTime = Date.now();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - startTime;

      // Check if it's a valid swipe gesture
      if (deltaTime > maxTime) return;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine swipe direction
      if (absDeltaX > absDeltaY && absDeltaX > minDistance) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else if (absDeltaY > absDeltaX && absDeltaY > minDistance) {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default scrolling during gesture detection
      if (touchStartRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        
        // If horizontal movement is greater, prevent vertical scroll
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Hook for gesture navigation between pages
export function useGestureNavigation() {
  const [location, setLocation] = useLocation();

  const pages = [
    "/",
    "/movements",
    "/analytics",
    "/settings"
  ];

  const currentIndex = pages.indexOf(location) || 0;

  const navigateToNext = () => {
    const nextIndex = (currentIndex + 1) % pages.length;
    setLocation(pages[nextIndex]);
  };

  const navigateToPrevious = () => {
    const prevIndex = currentIndex === 0 ? pages.length - 1 : currentIndex - 1;
    setLocation(pages[prevIndex]);
  };

  const canGoNext = currentIndex < pages.length - 1;
  const canGoPrevious = currentIndex > 0;

  return {
    navigateToNext,
    navigateToPrevious,
    canGoNext,
    canGoPrevious,
    currentPage: pages[currentIndex],
    currentIndex
  };
}
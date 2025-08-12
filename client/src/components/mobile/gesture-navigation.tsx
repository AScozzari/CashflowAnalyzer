import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

interface GestureNavigationProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  enableNavigation?: boolean;
}

export function useGestureNavigation() {
  const [location, setLocation] = useLocation();
  
  const routes = ["/dashboard", "/movements", "/analytics", "/settings"];
  const currentIndex = routes.indexOf(location);
  
  const navigateToNext = () => {
    if (currentIndex < routes.length - 1) {
      setLocation(routes[currentIndex + 1]);
    }
  };
  
  const navigateToPrevious = () => {
    if (currentIndex > 0) {
      setLocation(routes[currentIndex - 1]);
    }
  };
  
  return {
    navigateToNext,
    navigateToPrevious,
    canGoNext: currentIndex < routes.length - 1,
    canGoPrevious: currentIndex > 0,
    currentRoute: routes[currentIndex]
  };
}

export function GestureNavigation({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  enableNavigation = true 
}: GestureNavigationProps) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const { navigateToNext, navigateToPrevious, canGoNext, canGoPrevious } = useGestureNavigation();

  const handleTouchStart = (e: TouchEvent) => {
    if (!enableNavigation) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!enableNavigation || touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    const minSwipeDistance = 100;
    const maxVerticalDistance = 150;

    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaY) < maxVerticalDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous page
        if (canGoPrevious) {
          onSwipeRight ? onSwipeRight() : navigateToPrevious();
        }
      } else {
        // Swipe left - go to next page
        if (canGoNext) {
          onSwipeLeft ? onSwipeLeft() : navigateToNext();
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableNavigation, canGoNext, canGoPrevious]);

  return (
    <div ref={elementRef} className="w-full h-full touch-pan-y">
      {children}
    </div>
  );
}
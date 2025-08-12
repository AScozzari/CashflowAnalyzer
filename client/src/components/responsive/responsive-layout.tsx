import { ReactNode, useEffect, useState } from "react";
import { BottomNavigation, MobileHeader } from "@/components/mobile/bottom-navigation";
import { GestureNavigation, useGestureNavigation } from "@/components/mobile/gesture-navigation";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBottomNav?: boolean;
  enableGestures?: boolean;
  className?: string;
}

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      return {
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      };
    }
    return {
      width: 0,
      height: 0,
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

export function ResponsiveLayout({
  children,
  title,
  subtitle,
  showBottomNav = true,
  enableGestures = true,
  className
}: ResponsiveLayoutProps) {
  const { isMobile } = useScreenSize();
  const { navigateToNext, navigateToPrevious, canGoNext, canGoPrevious } = useGestureNavigation();

  const content = (
    <div className={cn(
      "min-h-screen bg-background transition-colors",
      isMobile && "pb-20", // Space for bottom navigation
      className
    )}>
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader title={title} subtitle={subtitle} />
      )}
      
      {/* Content */}
      <main className={cn(
        "relative",
        isMobile ? "px-4 py-6" : "p-6"
      )}>
        {children}
      </main>
      
      {/* Bottom Navigation for Mobile */}
      {isMobile && showBottomNav && (
        <BottomNavigation />
      )}
    </div>
  );

  // Wrap with gesture navigation if enabled
  if (enableGestures && isMobile) {
    return (
      <GestureNavigation
        onSwipeLeft={canGoNext ? navigateToNext : undefined}
        onSwipeRight={canGoPrevious ? navigateToPrevious : undefined}
        enableNavigation={true}
      >
        {content}
      </GestureNavigation>
    );
  }

  return content;
}

// Hook for responsive behavior
export function useResponsiveBreakpoints() {
  const { isMobile, isTablet, isDesktop, width } = useScreenSize();
  
  const getColumns = (mobile: number, tablet: number, desktop: number) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  const getSpacing = (mobile: string, tablet: string, desktop: string) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  const getTextSize = (mobile: string, tablet: string, desktop: string) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    return desktop;
  };

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    getColumns,
    getSpacing,
    getTextSize
  };
}

// Responsive grid component
interface ResponsiveGridProps {
  children: ReactNode;
  mobile?: number;
  tablet?: number;
  desktop?: number;
  gap?: string;
  className?: string;
}

export function ResponsiveGrid({
  children,
  mobile = 1,
  tablet = 2,
  desktop = 3,
  gap = "gap-4",
  className
}: ResponsiveGridProps) {
  const { getColumns } = useResponsiveBreakpoints();
  const columns = getColumns(mobile, tablet, desktop);

  return (
    <div className={cn(
      "grid",
      `grid-cols-${columns}`,
      gap,
      className
    )}>
      {children}
    </div>
  );
}

// Responsive card component
interface ResponsiveCardProps {
  children: ReactNode;
  fullWidth?: boolean;
  padding?: "sm" | "md" | "lg";
  className?: string;
}

export function ResponsiveCard({
  children,
  fullWidth = false,
  padding = "md",
  className
}: ResponsiveCardProps) {
  const { isMobile } = useScreenSize();
  
  const paddingClasses = {
    sm: isMobile ? "p-3" : "p-4",
    md: isMobile ? "p-4" : "p-6",
    lg: isMobile ? "p-6" : "p-8"
  };

  return (
    <div className={cn(
      "bg-card border border-border rounded-lg shadow-sm transition-colors",
      paddingClasses[padding],
      fullWidth && "w-full",
      className
    )}>
      {children}
    </div>
  );
}
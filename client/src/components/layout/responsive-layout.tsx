import { ReactNode, useState, useEffect } from "react";
import { BottomNavigation } from "@/components/mobile/bottom-navigation";
import Header from "@/components/layout/header";
import FooterSignature from "@/components/layout/footer-signature";

interface ResponsiveLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  enableGestures?: boolean;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

export function ResponsiveLayout({ 
  title, 
  subtitle, 
  children, 
  enableGestures = false 
}: ResponsiveLayoutProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background transition-colors pb-20">
        <Header title={title} subtitle={subtitle} />
        
        <div className="p-4">
          {children}
        </div>
        
        <BottomNavigation />
      </div>
    );
  }

  // Desktop layout - fallback to simple layout
  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header title={title} subtitle={subtitle} />
      
      <div className="p-6">
        {children}
      </div>
      
      <FooterSignature />
    </div>
  );
}
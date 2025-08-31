import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export function useDynamicFavicon() {
  // Fetch theme settings for branding
  const { data: themeSettings } = useQuery({
    queryKey: ['/api/themes/settings'],
    queryFn: async () => {
      const response = await fetch('/api/themes/settings');
      if (!response.ok) throw new Error('Failed to fetch theme settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (themeSettings?.faviconUrl) {
      // Find existing favicon link or create one
      let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      
      // Update favicon URL
      faviconLink.href = themeSettings.faviconUrl;
      
      // Also update shortcut icon if it exists
      const shortcutIcon = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
      if (shortcutIcon) {
        shortcutIcon.href = themeSettings.faviconUrl;
      }
      
      console.log('[BRANDING] Favicon updated:', themeSettings.faviconUrl);
    }
  }, [themeSettings?.faviconUrl]);

  useEffect(() => {
    if (themeSettings?.companyName) {
      // Update page title dynamically
      document.title = `${themeSettings.companyName} - Financial Management`;
      console.log('[BRANDING] Page title updated:', document.title);
    }
  }, [themeSettings?.companyName]);

  return themeSettings;
}
// Badge management utilities for PWA icon and browser tab indicators
import { AndroidNotificationService } from '../services/notificationService';

/**
 * Detect if the user is on Android
 */
export const isAndroid = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * Detect if the user is on a mobile device
 */
export const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Check if notification permissions are granted
 */
export const hasNotificationPermission = (): boolean => {
  return AndroidNotificationService.hasPermission();
};

/**
 * Request notification permissions for Android badge support
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  return AndroidNotificationService.requestPermission();
};

/**
 * Update badge using notifications for Android (triggers automatic badge)
 */
export const updateAndroidBadge = async (count: number): Promise<void> => {
  if (!isAndroid() || !AndroidNotificationService.isSupported()) {
    return;
  }

  try {
    await AndroidNotificationService.updateBadgeCount(count);
  } catch (error) {
    console.error('Error updating Android badge:', error);
  }
};

/**
 * Generate a favicon with a red badge showing the count
 */
export const generateBadgedFavicon = (count: number): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = 32;
  canvas.height = 32;
  
  // Draw base icon (simple circle representing the app)
  ctx.fillStyle = '#1976d2'; // Primary theme color
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, 2 * Math.PI);
  ctx.fill();
  
  // Draw white checkmark in center
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, 16);
  ctx.lineTo(14, 20);
  ctx.lineTo(22, 10);
  ctx.stroke();
  
  // Draw red badge with count if count > 0
  if (count > 0) {
    const countText = count > 99 ? '99+' : count.toString();
    
    // Badge background
    ctx.fillStyle = '#f44336'; // Red color
    ctx.beginPath();
    ctx.arc(26, 8, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Badge border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Badge text
    ctx.fillStyle = '#ffffff';
    ctx.font = count > 9 ? '8px Arial' : '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(countText, 26, 8);
  }
  
  return canvas.toDataURL();
};

/**
 * Update the browser favicon
 */
export const updateFavicon = (dataUrl: string) => {
  // Remove existing favicon
  const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (existingFavicon) {
    existingFavicon.remove();
  }
  
  // Add new favicon with badge
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = dataUrl;
  document.head.appendChild(link);
};

/**
 * Update the PWA app badge using the Badge API (desktop/Mac)
 */
export const updateAppBadge = async (count: number) => {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    } catch (error) {
      console.log('Badge API not supported or failed:', error);
    }
  }
};

/**
 * Universal badge update that chooses the right method for the platform
 */
export const updatePlatformBadge = async (count: number): Promise<void> => {
  if (isAndroid() && hasNotificationPermission()) {
    // Use notification-based badge for Android
    await updateAndroidBadge(count);
  } else {
    // Use Badge API for desktop/other platforms
    await updateAppBadge(count);
  }
};

/**
 * Initialize badge system (request permissions if needed)
 */
export const initializeBadgeSystem = async (): Promise<boolean> => {
  if (isAndroid()) {
    // Request notification permission for Android badge support
    return await requestNotificationPermission();
  }
  
  // For other platforms, Badge API doesn't require special permissions
  return 'setAppBadge' in navigator;
};

/**
 * Update the document title with todo count
 */
export const updateDocumentTitle = (count: number, baseTitle: string = 'Todo Flow') => {
  if (count > 0) {
    document.title = `(${count}) ${baseTitle}`;
  } else {
    document.title = baseTitle;
  }
};

/**
 * Clear all badge indicators
 */
export const clearAllBadges = async () => {
  // Clear platform-specific badge
  await updatePlatformBadge(0);
  
  // Reset document title
  updateDocumentTitle(0);
  
  // Reset to original favicon
  const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (existingFavicon) {
    existingFavicon.remove();
  }
  
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = '/favicon.ico';
  document.head.appendChild(link);
}; 
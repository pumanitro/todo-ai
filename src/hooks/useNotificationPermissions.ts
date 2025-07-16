import { useState, useEffect } from 'react';
import { isAndroid } from '../utils/badgeUtils';
import { AndroidNotificationService } from '../services/notificationService';

interface UseNotificationPermissionsProps {
  badgeSupported: boolean;
}

interface UseNotificationPermissionsReturn {
  showPermissionPrompt: boolean;
  requestPermission: () => Promise<void>;
  dismissPrompt: () => void;
  hasPermission: boolean;
  isAndroidDevice: boolean;
}

export const useNotificationPermissions = ({ 
  badgeSupported 
}: UseNotificationPermissionsProps): UseNotificationPermissionsReturn => {
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  
  const isAndroidDevice = isAndroid();

  // Check current permission status
  useEffect(() => {
    setHasPermission(AndroidNotificationService.hasPermission());
  }, []);

  // Show permission prompt for Android users who need it
  useEffect(() => {
    if (isAndroidDevice && !badgeSupported && AndroidNotificationService.isSupported()) {
      const promptShown = localStorage.getItem('notificationPromptShown');
      const shouldShow = !promptShown && 
                        Notification.permission === 'default' && 
                        !hasPermission;
      
      setShowPermissionPrompt(shouldShow);
    }
  }, [isAndroidDevice, badgeSupported, hasPermission]);

  const requestPermission = async (): Promise<void> => {
    try {
      const granted = await AndroidNotificationService.requestPermission();
      setHasPermission(granted);
      
      if (granted) {
        console.log('Notification permission granted for badge support');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setShowPermissionPrompt(false);
      localStorage.setItem('notificationPromptShown', 'true');
    }
  };

  const dismissPrompt = (): void => {
    setShowPermissionPrompt(false);
    localStorage.setItem('notificationPromptShown', 'true');
  };

  return {
    showPermissionPrompt,
    requestPermission,
    dismissPrompt,
    hasPermission,
    isAndroidDevice
  };
}; 
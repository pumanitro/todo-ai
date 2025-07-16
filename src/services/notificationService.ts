/**
 * Android notification service for badge functionality
 * Handles notification-based badges since Android doesn't support the Badge API
 */

export interface NotificationBadgeOptions {
  count: number;
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export class AndroidNotificationService {
  private static readonly DEFAULT_TAG = 'todo-badge';
  private static readonly DEFAULT_ICON = '/icon-192.png';
  private static readonly DEFAULT_TITLE = 'Todo Flow';

  /**
   * Check if the device supports service worker notifications
   */
  static isSupported(): boolean {
    return 'serviceWorker' in navigator && 'Notification' in window;
  }

  /**
   * Get the service worker registration
   */
  private static async getRegistration(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    return navigator.serviceWorker.ready;
  }

  /**
   * Show a badge notification for Android
   */
  static async showBadgeNotification(options: NotificationBadgeOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Notifications not supported');
    }

    try {
      const registration = await this.getRegistration();
      
      const notificationOptions: NotificationOptions = {
        body: options.body || `${options.count} task${options.count === 1 ? '' : 's'} remaining today`,
        icon: options.icon || this.DEFAULT_ICON,
        badge: options.badge || this.DEFAULT_ICON,
        tag: options.tag || this.DEFAULT_TAG,
        silent: true,
        requireInteraction: false,
        data: {
          type: 'badge-update',
          count: options.count
        }
      };

      await registration.showNotification(
        options.title || this.DEFAULT_TITLE, 
        notificationOptions
      );
    } catch (error) {
      console.error('Error showing badge notification:', error);
      throw error;
    }
  }

  /**
   * Clear badge notifications
   */
  static async clearBadgeNotifications(tag?: string): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      const registration = await this.getRegistration();
      const notificationTag = tag || this.DEFAULT_TAG;
      
      const notifications = await registration.getNotifications({ tag: notificationTag });
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Error clearing badge notifications:', error);
    }
  }

  /**
   * Update the badge count (show if count > 0, clear if count = 0)
   */
  static async updateBadgeCount(count: number, options?: Partial<NotificationBadgeOptions>): Promise<void> {
    if (count > 0) {
      await this.showBadgeNotification({
        count,
        ...options
      });
    } else {
      await this.clearBadgeNotifications(options?.tag);
    }
  }

  /**
   * Check if notification permissions are granted
   */
  static hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Request notification permissions
   */
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
} 
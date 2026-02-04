import { useEffect, useState, useCallback } from 'react';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(async (options: PushNotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Push notifications are not supported');
      return false;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        console.warn('Notification permission denied');
        return false;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds if not interacted
      setTimeout(() => {
        notification.close();
      }, 10000);

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [isSupported, permission, requestPermission]);

  const showLowStockAlert = useCallback((productName: string, currentStock: number, minStock: number) => {
    return showNotification({
      title: '⚠️ Stock Bajo',
      body: `${productName} tiene stock bajo. Actual: ${currentStock}, Mínimo: ${minStock}`,
      tag: `low-stock-${productName}`,
      requireInteraction: true,
    });
  }, [showNotification]);

  const showSaleNotification = useCallback((saleNumber: number, total: number) => {
    const formattedTotal = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(total);

    return showNotification({
      title: '✅ Venta Completada',
      body: `Venta #${saleNumber} por ${formattedTotal}`,
      tag: `sale-${saleNumber}`,
    });
  }, [showNotification]);

  const showNewNotificationAlert = useCallback((title: string, message: string, type: string) => {
    const icons: Record<string, string> = {
      warning: '⚠️',
      error: '❌',
      success: '✅',
      info: 'ℹ️',
    };
    
    return showNotification({
      title: `${icons[type] || 'ℹ️'} ${title}`,
      body: message,
      tag: `notification-${Date.now()}`,
      requireInteraction: type === 'warning' || type === 'error',
    });
  }, [showNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    showLowStockAlert,
    showSaleNotification,
    showNewNotificationAlert,
  };
};

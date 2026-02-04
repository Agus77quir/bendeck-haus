import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { cn } from '@/lib/utils';

export const NotificationPermissionBanner = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === 'granted' || isDismissed) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 max-w-sm",
      "glass-card p-4 border border-primary/30 shadow-lg",
      "animate-in slide-in-from-bottom-4 duration-300"
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/20">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground text-sm">
            Activar notificaciones
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Recibe alertas de stock bajo y actualizaciones importantes en tiempo real.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleRequestPermission}
              className="text-xs"
            >
              Activar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-xs"
            >
              Más tarde
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

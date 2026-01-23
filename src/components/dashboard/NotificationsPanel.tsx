import { Bell, Check, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationsPanelProps {
  className?: string;
}

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle,
};

const typeColors = {
  info: 'text-info bg-info/10 border-info/30',
  warning: 'text-warning bg-warning/10 border-warning/30',
  error: 'text-destructive bg-destructive/10 border-destructive/30',
  success: 'text-success bg-success/10 border-success/30',
};

export const NotificationsPanel = ({ className }: NotificationsPanelProps) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className={cn("glass-card p-6", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-secondary rounded w-1/2" />
          <div className="h-20 bg-secondary rounded" />
          <div className="h-20 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <Check className="w-4 h-4 mr-1" />
            Marcar todo
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Bell className="w-10 h-10 mb-2" />
          <p className="text-sm">Sin notificaciones</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.slice(0, 10).map((notification) => {
            const notificationType = (notification.type || 'info') as keyof typeof typeIcons;
            const Icon = typeIcons[notificationType];
            const colorClass = typeColors[notificationType];

            return (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  colorClass,
                  !notification.read && "ring-1 ring-primary/30",
                  notification.read && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {formatDistanceToNow(new Date(notification.created_at || ''), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import { useState } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, BellRing, Check, CheckCheck, AlertTriangle, Info, ShoppingCart, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';
type Notification = Tables<'notifications'>;
type GroupedNotifications = [string, Notification[]][];

const Notifications = () => {
  const { notifications, unreadCount, refetch } = useNotifications();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const [markingAll, setMarkingAll] = useState(false);

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'sale':
        return <ShoppingCart className="w-5 h-5 text-green-500" />;
      case 'stock':
        return <Package className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatDateHeader = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';
    return format(date, "EEEE, d 'de' MMMM yyyy", { locale: es });
  };

  const groupNotificationsByDate = () => {
    const grouped: GroupedNotifications = {};
    
    notifications.forEach((notification) => {
      const date = format(parseISO(notification.created_at!), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(notification);
    });

    return Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      toast.error('Error al marcar como leída');
    } else {
      refetch();
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) {
      toast.error('Error al marcar todas como leídas');
    } else {
      toast.success('Todas las notificaciones marcadas como leídas');
      refetch();
    }
    setMarkingAll(false);
  };

  const handlePushToggle = async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
  };

  const groupedNotifications = groupNotificationsByDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Historial de alertas y notificaciones del sistema
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead} 
            disabled={markingAll}
            variant="outline"
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas ({unreadCount})
          </Button>
        )}
      </div>

      {/* Push Notifications Settings */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" />
            Notificaciones Push
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Alertas del navegador</p>
              <p className="text-sm text-muted-foreground">
                {!isSupported 
                  ? 'Tu navegador no soporta notificaciones push'
                  : permission === 'granted'
                    ? 'Recibirás alertas de stock bajo y ventas'
                    : permission === 'denied'
                      ? 'Las notificaciones están bloqueadas en tu navegador'
                      : 'Activa para recibir alertas en tiempo real'
                }
              </p>
            </div>
            <Switch
              checked={permission === 'granted'}
              onCheckedChange={handlePushToggle}
              disabled={!isSupported || permission === 'denied'}
            />
          </div>
          {permission === 'denied' && (
            <p className="text-xs text-destructive mt-2">
              Para habilitar, ve a la configuración de tu navegador y permite las notificaciones para este sitio.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay notificaciones</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedNotifications.map(([date, dayNotifications]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {formatDateHeader(date)}
              </h3>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {dayNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn(
                            "font-medium truncate",
                            !notification.read && "text-foreground",
                            notification.read && "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <Badge variant="default" className="text-xs px-1.5 py-0">
                              Nueva
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {format(parseISO(notification.created_at!), 'HH:mm', { locale: es })}
                        </p>
                      </div>

                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;

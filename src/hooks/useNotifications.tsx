import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { Database } from '@/integrations/supabase/types';
import { usePushNotifications } from './usePushNotifications';

type Notification = Database['public']['Tables']['notifications']['Row'];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin } = useAuthStore();
  const { selectedBusiness } = useBusinessStore();
  const { showNewNotificationAlert, permission } = usePushNotifications();

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!isAdmin && selectedBusiness) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null,business.eq.${selectedBusiness}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin, selectedBusiness]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Create a notification (for admin use or system triggers)
  const createNotification = async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    business?: string
  ) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          type,
          business: business as any,
          user_id: null, // Broadcast to all users of the business
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up realtime subscription for notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if notification is relevant for current user
          const isRelevant = 
            isAdmin ||
            newNotification.user_id === user?.id ||
            newNotification.user_id === null ||
            newNotification.business === selectedBusiness;

          if (isRelevant) {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show push notification if permission granted
            if (permission === 'granted') {
              showNewNotificationAlert(
                newNotification.title,
                newNotification.message,
                newNotification.type || 'info'
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, selectedBusiness, fetchNotifications, permission, showNewNotificationAlert]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications,
  };
};

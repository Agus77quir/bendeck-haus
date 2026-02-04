import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { GearIcon } from '@/components/icons/GearIcon';
import { NotificationPermissionBanner } from '@/components/notifications/NotificationPermissionBanner';

export const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, isLoading, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <GearIcon className="w-16 h-16 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onSignOut={signOut} />
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
      <NotificationPermissionBanner />
    </div>
  );
};

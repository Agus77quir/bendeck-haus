import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GearIcon } from '@/components/icons/GearIcon';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

interface SidebarProps {
  onSignOut: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', adminOnly: false },
  { icon: ShoppingCart, label: 'Ventas', path: '/dashboard/sales', adminOnly: false },
  { icon: Package, label: 'Productos', path: '/dashboard/products', adminOnly: true },
  { icon: Users, label: 'Clientes', path: '/dashboard/customers', adminOnly: false },
  { icon: CreditCard, label: 'Cuentas Corrientes', path: '/dashboard/accounts', adminOnly: false },
  { icon: BarChart3, label: 'Reportes', path: '/dashboard/reports', adminOnly: true },
  { icon: Bell, label: 'Notificaciones', path: '/dashboard/notifications', adminOnly: false },
  { icon: Settings, label: 'Configuración', path: '/dashboard/settings', adminOnly: true },
];

export const Sidebar = ({ onSignOut }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuthStore();
  const { selectedBusiness } = useBusinessStore();

  const businessName = selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff';

  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  const SidebarContent = ({ isMobile = false, onNavigate }: { isMobile?: boolean; onNavigate?: () => void }) => (
    <div className={cn(
      "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed && !isMobile ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <GearIcon className="w-10 h-10 text-primary flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-foreground truncate">BENDECK</span>
              <span className="text-xs text-primary truncate">{businessName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground orange-glow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive && "animate-pulse"
              )} />
              {(!collapsed || isMobile) && (
                <span className="font-medium truncate">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Button
          variant="ghost"
          onClick={onSignOut}
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && !isMobile && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5" />
          {(!collapsed || isMobile) && <span>Cerrar Sesión</span>}
        </Button>
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="bg-card border-border">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetClose asChild>
              <div className="h-full">
                <SidebarContent isMobile onNavigate={() => {}} />
              </div>
            </SheetClose>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

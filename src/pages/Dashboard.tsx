import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProductsList } from '@/components/dashboard/TopProductsList';
import { LowStockAlert } from '@/components/dashboard/LowStockAlert';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { GearIcon } from '@/components/icons/GearIcon';
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  TrendingUp 
} from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const Dashboard = () => {
  const { stats, topProducts, leastSoldProducts, dailySales, weeklySales, isLoading } = useDashboardStats();
  const { selectedBusiness } = useBusinessStore();
  const { isAdmin, user } = useAuthStore();

  const businessName = selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <GearIcon className="w-16 h-16 text-primary animate-spin" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAdmin ? 'Vista de administrador' : `Vista de vendedor - ${businessName}`}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm text-muted-foreground">Datos en tiempo real</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas Hoy"
          value={formatCurrency(stats.totalSalesToday)}
          subtitle={`${stats.salesCount} transacciones`}
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Ventas Semana"
          value={formatCurrency(stats.totalSalesWeek)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Total Productos"
          value={stats.totalProducts.toString()}
          subtitle={`${stats.lowStockProducts} con stock bajo`}
          icon={Package}
          variant={stats.lowStockProducts > 0 ? 'warning' : 'default'}
        />
        <StatCard
          title="Clientes Activos"
          value={stats.totalCustomers.toString()}
          icon={Users}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart 
          data={dailySales} 
          title="Ventas Últimos 7 Días" 
          type="area"
        />
        <SalesChart 
          data={weeklySales} 
          title="Ventas por Semana" 
          type="bar"
        />
      </div>

      {/* Products and Alerts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TopProductsList
          products={topProducts}
          title="Más Vendidos del Mes"
          type="top"
        />
        <TopProductsList
          products={leastSoldProducts}
          title="Menos Vendidos"
          type="least"
        />
        <LowStockAlert />
      </div>

      {/* Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotificationsPanel />
        
        {/* Quick Stats */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Resumen del Mes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Ventas Totales</span>
              <span className="font-bold text-primary">{formatCurrency(stats.totalSalesMonth)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Promedio por Venta</span>
              <span className="font-bold text-foreground">
                {stats.salesCount > 0 
                  ? formatCurrency(stats.totalSalesToday / stats.salesCount) 
                  : formatCurrency(0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-muted-foreground">Productos Activos</span>
              <span className="font-bold text-foreground">{stats.totalProducts}</span>
            </div>
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-warning">Productos con Stock Bajo</span>
                </div>
                <span className="font-bold text-warning">{stats.lowStockProducts}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

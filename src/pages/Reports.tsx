import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useReports, type ReportPeriod } from '@/hooks/useReports';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProductsList } from '@/components/dashboard/TopProductsList';
import { PaymentMethodsChart } from '@/components/reports/PaymentMethodsChart';
import { ReportStatsCards } from '@/components/reports/ReportStatsCards';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  TrendingUp,
  Package,
  CreditCard,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const Reports = () => {
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const { isLoading, salesByDate, topProducts, leastProducts, paymentMethods, stats, dateRange } = useReports(period, customRange);

  const handlePeriodChange = (newPeriod: ReportPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      setCustomRange(undefined);
    }
  };

  const handleCustomRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setCustomRange({ from: range.from, to: range.to });
      setPeriod('custom');
      setDatePickerOpen(false);
    }
  };

  return (
    <div className="space-y-6 pl-12 md:pl-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Reportes
          </h1>
          <p className="text-muted-foreground">
            Análisis de ventas y rendimiento del negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {format(dateRange.from, 'dd/MM/yy', { locale: es })} - {format(dateRange.to, 'dd/MM/yy', { locale: es })}
          </Badge>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={period === 'daily' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePeriodChange('daily')}
        >
          Últimos 7 días
        </Button>
        <Button
          variant={period === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePeriodChange('weekly')}
        >
          Últimas 4 semanas
        </Button>
        <Button
          variant={period === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePeriodChange('monthly')}
        >
          Últimos 6 meses
        </Button>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
            >
              <CalendarIcon className="h-4 w-4" />
              Personalizado
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={handleCustomRangeSelect as any}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Stats Cards */}
      <ReportStatsCards stats={stats} isLoading={isLoading} />

      {/* Charts Section */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Ventas</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Productos</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4">
            <SalesChart 
              data={salesByDate} 
              title="Ventas por Período" 
              type="bar"
            />
            <SalesChart 
              data={salesByDate} 
              title="Tendencia de Ventas" 
              type="area"
            />
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <TopProductsList 
              products={topProducts} 
              title="Productos Más Vendidos" 
              type="top"
            />
            <TopProductsList 
              products={leastProducts} 
              title="Productos Menos Vendidos" 
              type="least"
            />
          </div>
          <ProductsBarChart products={topProducts} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <PaymentMethodsChart data={paymentMethods} />
            <PaymentMethodsTable data={paymentMethods} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Inline component for products bar chart
const ProductsBarChart = ({ products }: { products: Array<{ id: string; name: string; code: string; totalSold: number; revenue: number }> }) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-card p-3 border border-border">
          <p className="text-sm font-medium text-foreground">{data.name}</p>
          <p className="text-xs text-muted-foreground">Código: {data.code}</p>
          <p className="text-sm text-primary font-bold">
            {data.totalSold} unidades
          </p>
          <p className="text-xs text-muted-foreground">
            Ingreso: {formatCurrency(data.revenue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Unidades Vendidas por Producto</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={products.slice(0, 10)} layout="vertical" margin={{ left: 100, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
            <XAxis type="number" stroke="hsl(0, 0%, 60%)" />
            <YAxis 
              type="category" 
              dataKey="name" 
              stroke="hsl(0, 0%, 60%)"
              tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalSold" fill="hsl(24, 100%, 50%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// Inline component for payment methods table
const PaymentMethodsTable = ({ data }: { data: Array<{ method: string; total: number; count: number }> }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalAmount = data.reduce((sum, item) => sum + item.total, 0);
  const totalCount = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Detalle por Método de Pago</h3>
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Sin datos disponibles</p>
        ) : (
          <>
            {data.map((item) => (
              <div 
                key={item.method} 
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              >
                <div>
                  <p className="font-medium text-foreground">{item.method}</p>
                  <p className="text-xs text-muted-foreground">{item.count} transacciones</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{formatCurrency(item.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {totalAmount > 0 ? ((item.total / totalAmount) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Total</p>
                  <p className="text-xs text-muted-foreground">{totalCount} transacciones</p>
                </div>
                <p className="text-xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default Reports;

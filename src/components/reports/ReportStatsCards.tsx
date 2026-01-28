import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  previousPeriodRevenue: number;
  revenueChange: number;
}

interface ReportStatsCardsProps {
  stats: ReportStats;
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

export const ReportStatsCards = ({ stats, isLoading }: ReportStatsCardsProps) => {
  const cards = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      change: stats.revenueChange,
      iconBgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Cantidad de Ventas',
      value: stats.totalSales.toString(),
      icon: ShoppingCart,
      iconBgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(stats.averageTicket),
      icon: Receipt,
      iconBgColor: 'bg-green-500/10',
      iconColor: 'text-green-500',
    },
    {
      title: 'Período Anterior',
      value: formatCurrency(stats.previousPeriodRevenue),
      icon: stats.revenueChange >= 0 ? TrendingUp : TrendingDown,
      iconBgColor: stats.revenueChange >= 0 ? 'bg-green-500/10' : 'bg-destructive/10',
      iconColor: stats.revenueChange >= 0 ? 'text-green-500' : 'text-destructive',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-6 w-20 bg-muted rounded" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", card.iconBgColor)}>
                <Icon className={cn("h-5 w-5", card.iconColor)} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-foreground truncate">{card.value}</p>
                <p className="text-xs text-muted-foreground truncate">{card.title}</p>
                {card.change !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    {card.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      card.change >= 0 ? "text-green-500" : "text-destructive"
                    )}>
                      {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

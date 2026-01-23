import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';

interface SalesChartProps {
  data: Array<{ date: string; total: number; count: number }>;
  title: string;
  type?: 'area' | 'bar';
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-border">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-primary font-bold">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.count !== undefined && (
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.count} ventas
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const SalesChart = ({ data, title, type = 'area', className }: SalesChartProps) => {
  return (
    <div className={cn("glass-card p-6", className)}>
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(24, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(0, 0%, 60%)" 
                tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(0, 0%, 60%)" 
                tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(24, 100%, 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(0, 0%, 60%)" 
                tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(0, 0%, 60%)" 
                tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill="hsl(24, 100%, 50%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

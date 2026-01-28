import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentMethodData {
  method: string;
  total: number;
  count: number;
}

interface PaymentMethodsChartProps {
  data: PaymentMethodData[];
}

const COLORS = [
  'hsl(24, 100%, 50%)',  // primary orange
  'hsl(142, 76%, 36%)',  // green
  'hsl(221, 83%, 53%)',  // blue
  'hsl(280, 65%, 60%)',  // purple
  'hsl(45, 93%, 47%)',   // yellow
  'hsl(0, 84%, 60%)',    // red
];

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
        <p className="text-sm font-medium text-foreground">{data.method}</p>
        <p className="text-sm text-primary font-bold">
          {formatCurrency(data.total)}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.count} transacciones
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => (
        <li key={`legend-${index}`} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

export const PaymentMethodsChart = ({ data }: PaymentMethodsChartProps) => {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Distribución por Método de Pago</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Sin datos disponibles
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Distribución por Método de Pago</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={4}
              dataKey="total"
              nameKey="method"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

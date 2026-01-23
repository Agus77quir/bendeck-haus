import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  code: string;
  totalSold: number;
  revenue: number;
}

interface TopProductsListProps {
  products: Product[];
  title: string;
  type: 'top' | 'least';
  className?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value);
};

export const TopProductsList = ({ products, title, type, className }: TopProductsListProps) => {
  const Icon = type === 'top' ? TrendingUp : TrendingDown;
  const iconColor = type === 'top' ? 'text-success' : 'text-destructive';

  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Icon className={cn("w-5 h-5", iconColor)} />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="w-10 h-10 mb-2" />
          <p className="text-sm">Sin datos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                type === 'top' 
                  ? index === 0 ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">Código: {product.code}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{product.totalSold}</p>
                <p className="text-xs text-muted-foreground">unidades</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { AlertTriangle, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface LowStockProduct {
  id: string;
  name: string;
  code: string;
  stock: number;
  min_stock: number;
}

interface LowStockAlertProps {
  className?: string;
}

export const LowStockAlert = ({ className }: LowStockAlertProps) => {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuthStore();
  const { selectedBusiness } = useBusinessStore();

  useEffect(() => {
    const fetchLowStockProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select('id, name, code, stock, min_stock')
          .eq('active', true);

        if (selectedBusiness && !isAdmin) {
          query = query.eq('business', selectedBusiness);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter low stock products
        const lowStock = data?.filter(p => p.stock <= p.min_stock) || [];
        setProducts(lowStock.sort((a, b) => a.stock - b.stock));
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLowStockProducts();

    // Set up realtime subscription
    const channel = supabase
      .channel('products-stock')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        () => {
          fetchLowStockProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, selectedBusiness]);

  if (isLoading) {
    return (
      <div className={cn("glass-card p-6", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-secondary rounded w-1/2" />
          <div className="h-16 bg-secondary rounded" />
          <div className="h-16 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("glass-card p-6", className)}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h3 className="text-lg font-semibold text-foreground">Alertas de Stock</h3>
        {products.length > 0 && (
          <Badge variant="destructive" className="ml-auto">
            {products.length}
          </Badge>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Package className="w-10 h-10 mb-2 text-success" />
          <p className="text-sm">Stock en niveles óptimos</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {products.map((product) => {
            const stockPercentage = (product.stock / product.min_stock) * 100;
            const isUrgent = product.stock === 0;
            const isCritical = stockPercentage <= 50;

            return (
              <div
                key={product.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isUrgent 
                    ? "bg-destructive/10 border-destructive/30" 
                    : isCritical 
                      ? "bg-warning/10 border-warning/30"
                      : "bg-secondary/30 border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Código: {product.code}</p>
                  </div>
                  <Badge
                    variant={isUrgent ? "destructive" : isCritical ? "outline" : "secondary"}
                    className={cn(
                      isUrgent && "animate-pulse",
                      isCritical && !isUrgent && "border-warning text-warning"
                    )}
                  >
                    {product.stock} / {product.min_stock}
                  </Badge>
                </div>
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all rounded-full",
                        isUrgent 
                          ? "bg-destructive" 
                          : isCritical 
                            ? "bg-warning" 
                            : "bg-primary"
                      )}
                      style={{ width: `${Math.min(100, stockPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

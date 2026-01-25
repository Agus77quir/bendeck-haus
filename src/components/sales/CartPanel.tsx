import { Trash2, Plus, Minus, ShoppingCart, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const CartPanel = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    updateDiscount,
    getSubtotal,
    getTotalDiscount,
    getTotal,
  } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Carrito vacío</p>
        <p className="text-sm text-center mt-2">
          Agregue productos desde el panel izquierdo
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Carrito ({items.length} items)
        </h3>
      </div>

      {/* Cart Items */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-muted/30 rounded-lg p-3 space-y-3"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-mono">
                    {item.product.code}
                  </p>
                  <p className="font-medium text-sm line-clamp-2">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(item.unitPrice)} c/u
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => removeItem(item.product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Quantity & Discount Controls */}
              <div className="flex items-center gap-4">
                {/* Quantity */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                    className="w-14 h-7 text-center text-sm"
                    min={1}
                    max={item.product.stock}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* Discount */}
                <div className="flex items-center gap-1">
                  <Percent className="h-3 w-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={item.discount}
                    onChange={(e) => updateDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                    className="w-16 h-7 text-center text-sm"
                    min={0}
                    max={100}
                    placeholder="0"
                  />
                </div>

                {/* Item Total */}
                <span className={cn(
                  "ml-auto font-semibold text-sm",
                  item.discount > 0 && "text-emerald-500"
                )}>
                  {formatCurrency(item.total)}
                </span>
              </div>

              {/* Stock Warning */}
              {item.quantity >= item.product.stock && (
                <p className="text-xs text-amber-500">
                  Stock máximo alcanzado
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Cart Summary */}
      <div className="p-4 border-t border-border space-y-2 bg-muted/30">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(getSubtotal())}</span>
        </div>
        
        {getTotalDiscount() > 0 && (
          <div className="flex justify-between text-sm text-emerald-500">
            <span>Descuentos</span>
            <span>-{formatCurrency(getTotalDiscount())}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(getTotal())}</span>
        </div>
      </div>
    </div>
  );
};

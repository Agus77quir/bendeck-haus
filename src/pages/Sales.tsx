import { useState } from 'react';
import { ShoppingCart, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ProductSearch } from '@/components/sales/ProductSearch';
import { CartPanel } from '@/components/sales/CartPanel';
import { CustomerSelector } from '@/components/sales/CustomerSelector';
import { PaymentSection } from '@/components/sales/PaymentSection';
import { CheckoutDialog } from '@/components/sales/CheckoutDialog';
import { useCartStore } from '@/stores/cartStore';
import { useBusinessStore } from '@/stores/businessStore';

export default function Sales() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { items, paymentMethod, getTotal, getItemCount } = useCartStore();
  const { selectedBusiness } = useBusinessStore();

  const businessName = selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff';

  const canCheckout = items.length > 0 && paymentMethod;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-12 md:pt-0 md:pl-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Nueva Venta
          </h1>
          <p className="text-muted-foreground mt-1">{businessName}</p>
        </div>
        
        {/* Mobile Cart Summary */}
        <div className="md:hidden flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Items:</span>
            <span className="font-bold">{getItemCount()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">Total:</span>
            <span className="font-bold text-primary">
              {new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
              }).format(getTotal())}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Products Panel */}
        <Card className="lg:col-span-7 overflow-hidden">
          <div className="h-[calc(100vh-220px)] md:h-[calc(100vh-180px)]">
            <ProductSearch />
          </div>
        </Card>

        {/* Right Panel - Cart & Checkout */}
        <div className="lg:col-span-5 space-y-4">
          {/* Cart */}
          <Card className="overflow-hidden">
            <div className="h-[300px] lg:h-[calc(50vh-100px)]">
              <CartPanel />
            </div>
          </Card>

          {/* Customer & Payment */}
          <Card className="p-4 space-y-4">
            <CustomerSelector />
            <Separator />
            <PaymentSection />
            <Separator />
            
            {/* Checkout Button */}
            <Button
              size="lg"
              className="w-full h-14 text-lg gap-2"
              disabled={!canCheckout}
              onClick={() => setCheckoutOpen(true)}
            >
              <Receipt className="h-5 w-5" />
              Finalizar Venta
            </Button>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}

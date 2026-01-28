import { useState } from 'react';
import { CheckCircle, Loader2, Receipt, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/stores/cartStore';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { TicketPrintDialog } from './TicketPrintDialog';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CheckoutDialog = ({ open, onOpenChange }: CheckoutDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [saleNumber, setSaleNumber] = useState<number | null>(null);
  const [showTicket, setShowTicket] = useState(false);

  const { toast } = useToast();
  const { user } = useAuthStore();
  const { selectedBusiness } = useBusinessStore();
  const {
    items,
    selectedCustomer,
    paymentMethod,
    notes,
    getSubtotal,
    getTotalDiscount,
    getTotal,
    clearCart,
  } = useCartStore();

  const businessName = selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff';

  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    account: 'Cuenta Corriente',
  };

  // Store sale data for ticket printing
  const [saleData, setSaleData] = useState<{
    items: typeof items;
    customer: typeof selectedCustomer;
    subtotal: number;
    discount: number;
    total: number;
    notes: string;
  } | null>(null);

  const handleConfirmSale = async () => {
    if (!user || !selectedBusiness || !paymentMethod) return;

    setIsProcessing(true);

    // Capture current cart state before clearing
    const capturedData = {
      items: [...items],
      customer: selectedCustomer,
      subtotal: getSubtotal(),
      discount: getTotalDiscount(),
      total: getTotal(),
      notes: notes,
    };

    try {
      // 1. Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          business: selectedBusiness,
          customer_id: selectedCustomer?.id || null,
          seller_id: user.id,
          status: 'completed',
          subtotal: capturedData.subtotal,
          discount: capturedData.discount,
          tax: 0,
          total: capturedData.total,
          payment_method: paymentMethod,
          notes: notes || null,
        })
        .select('id, sale_number')
        .single();

      if (saleError) throw saleError;

      // 2. Create sale items
      const saleItems = capturedData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        discount: item.discount,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // 3. If payment is to account, create account movement
      if (paymentMethod === 'account' && selectedCustomer) {
        const newBalance = Number(selectedCustomer.current_balance || 0) + capturedData.total;

        const { error: movementError } = await supabase
          .from('account_movements')
          .insert({
            customer_id: selectedCustomer.id,
            sale_id: sale.id,
            type: 'sale',
            amount: capturedData.total,
            balance_after: newBalance,
            description: `Venta #${sale.sale_number}`,
            created_by: user.id,
          });

        if (movementError) throw movementError;
      }

      setSaleNumber(sale.sale_number);
      setSaleData(capturedData);
      setIsComplete(true);

      toast({
        title: '¡Venta completada!',
        description: `Venta #${sale.sale_number} registrada exitosamente`,
      });

    } catch (error: any) {
      console.error('Error creating sale:', error);
      toast({
        variant: 'destructive',
        title: 'Error al procesar la venta',
        description: error.message || 'Por favor intente nuevamente',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isComplete) {
      clearCart();
      setIsComplete(false);
      setSaleNumber(null);
      setSaleData(null);
    }
    onOpenChange(false);
  };

  const handleNewSale = () => {
    clearCart();
    setIsComplete(false);
    setSaleNumber(null);
    setSaleData(null);
    onOpenChange(false);
  };

  const handlePrintTicket = () => {
    setShowTicket(true);
  };

  if (isComplete && saleNumber && saleData) {
    return (
      <>
        <Dialog open={open} onOpenChange={handleClose} aria-describedby="sale-success-description">
          <DialogContent className="max-w-md">
            <div className="flex flex-col items-center text-center py-6">
              <div className="bg-accent/20 rounded-full p-4 mb-4">
                <CheckCircle className="h-12 w-12 text-accent" />
              </div>
              <DialogTitle className="text-2xl mb-2">¡Venta Exitosa!</DialogTitle>
              <DialogDescription id="sale-success-description" className="text-lg">
                Venta #{saleNumber} completada
              </DialogDescription>
              <p className="text-3xl font-bold text-primary mt-4">
                {formatCurrency(saleData.total)}
              </p>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button variant="outline" className="w-full gap-2" onClick={handlePrintTicket}>
                <Printer className="h-4 w-4" />
                Imprimir Comprobante
              </Button>
              <Button onClick={handleNewSale} className="w-full">
                Nueva Venta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TicketPrintDialog
          open={showTicket}
          onOpenChange={setShowTicket}
          saleNumber={saleNumber}
          businessName={businessName}
          items={saleData.items}
          customer={saleData.customer}
          paymentMethod={paymentMethod || ''}
          subtotal={saleData.subtotal}
          discount={saleData.discount}
          total={saleData.total}
          sellerName={user?.user_metadata?.full_name || user?.email}
          notes={saleData.notes}
        />
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Confirmar Venta
          </DialogTitle>
          <DialogDescription>
            Revise los detalles antes de confirmar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer */}
          {selectedCustomer && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{selectedCustomer.name}</p>
              <p className="text-sm text-muted-foreground">{selectedCustomer.code}</p>
            </div>
          )}

          {/* Items Summary */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-muted-foreground mb-2">
              {items.length} producto(s)
            </p>
            <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span className="truncate flex-1">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-medium ml-2">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Método de Pago</p>
            <p className="font-medium">{paymentLabels[paymentMethod || ''] || '-'}</p>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(getSubtotal())}</span>
            </div>
            {getTotalDiscount() > 0 && (
              <div className="flex justify-between text-sm text-accent">
                <span>Descuentos</span>
                <span>-{formatCurrency(getTotalDiscount())}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(getTotal())}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmSale} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              'Confirmar Venta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { Banknote, CreditCard, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

const paymentMethods = [
  { id: 'cash', label: 'Efectivo', icon: Banknote },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'transfer', label: 'Transferencia', icon: Building2 },
  { id: 'account', label: 'Cuenta Corriente', icon: FileText },
] as const;

export const PaymentSection = () => {
  const { paymentMethod, setPaymentMethod, notes, setNotes, selectedCustomer } = useCartStore();

  // Filter account option if no customer selected
  const availableMethods = paymentMethods.filter(
    method => method.id !== 'account' || selectedCustomer
  );

  return (
    <div className="space-y-4">
      {/* Payment Method */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Método de Pago
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {availableMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = paymentMethod === method.id;
            
            return (
              <Button
                key={method.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "h-auto py-3 flex-col gap-1",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
                onClick={() => setPaymentMethod(method.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{method.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Account Warning */}
      {paymentMethod === 'account' && selectedCustomer && (
        <div className="text-sm text-amber-500 bg-amber-500/10 rounded-lg p-3">
          Esta venta se cargará a la cuenta corriente de{' '}
          <strong>{selectedCustomer.name}</strong>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium text-muted-foreground">
          Notas (opcional)
        </Label>
        <Textarea
          id="notes"
          placeholder="Agregar observaciones..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>
    </div>
  );
};

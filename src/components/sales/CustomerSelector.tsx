import { useState } from 'react';
import { Search, User, X, CreditCard, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const CustomerSelector = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, isLoading } = useCustomers(searchTerm);
  const { selectedCustomer, setCustomer } = useCartStore();

  const handleSelectCustomer = (customer: Customer) => {
    setCustomer(customer);
    setOpen(false);
    setSearchTerm('');
  };

  const handleClearCustomer = () => {
    setCustomer(null);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Cliente</h4>

      {selectedCustomer ? (
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-sm text-muted-foreground">{selectedCustomer.code}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClearCustomer}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Account Info */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Saldo:</span>
              <span className={cn(
                "font-medium",
                Number(selectedCustomer.current_balance) > 0 && "text-amber-500",
                Number(selectedCustomer.current_balance) < 0 && "text-emerald-500"
              )}>
                {formatCurrency(Number(selectedCustomer.current_balance || 0))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Límite:</span>
              <span className="font-medium">
                {formatCurrency(Number(selectedCustomer.credit_limit || 0))}
              </span>
            </div>
          </div>

          {/* Warning if near limit */}
          {selectedCustomer.credit_limit && 
           Number(selectedCustomer.current_balance) >= Number(selectedCustomer.credit_limit) * 0.8 && (
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Cliente cerca del límite de crédito</span>
            </div>
          )}
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <User className="h-4 w-4" />
              Seleccionar cliente (opcional)
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Seleccionar Cliente</DialogTitle>
            </DialogHeader>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Customer List */}
            <ScrollArea className="max-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : customers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <User className="h-12 w-12 mb-2 opacity-50" />
                  <p>No se encontraron clientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customers.map((customer) => (
                    <button
                      key={customer.id}
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{customer.code}</span>
                            {customer.phone && (
                              <>
                                <span>•</span>
                                <span>{customer.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={Number(customer.current_balance) > 0 ? "secondary" : "outline"}
                        >
                          {formatCurrency(Number(customer.current_balance || 0))}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

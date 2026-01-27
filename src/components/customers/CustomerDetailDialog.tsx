import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCustomerDetail, type Customer } from '@/hooks/useCustomers';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  DollarSign,
  ShoppingBag,
  History,
  Receipt,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  onRefresh?: () => void;
}

export const CustomerDetailDialog = ({
  open,
  onOpenChange,
  customerId,
  onRefresh,
}: CustomerDetailDialogProps) => {
  const { customer, movements, sales, isLoading, refetch } = useCustomerDetail(
    open ? customerId : null
  );
  const { toast } = useToast();
  const { isAdmin, user } = useAuthStore();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (type: 'credit' | 'debit') => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Ingrese un monto válido',
        variant: 'destructive',
      });
      return;
    }

    if (!customer) return;

    setIsProcessing(true);
    try {
      const newBalance =
        type === 'credit'
          ? (customer.current_balance || 0) + amount
          : (customer.current_balance || 0) - amount;

      const { error } = await supabase.from('account_movements').insert({
        customer_id: customer.id,
        type: type === 'credit' ? 'credit' : 'payment',
        amount: type === 'credit' ? amount : -amount,
        balance_after: newBalance,
        description:
          paymentDescription.trim() ||
          (type === 'credit' ? 'Cargo a cuenta' : 'Pago recibido'),
        created_by: user?.id,
      });

      if (error) throw error;

      toast({
        title: type === 'credit' ? 'Cargo registrado' : 'Pago registrado',
        description: `Se ${
          type === 'credit' ? 'cargó' : 'registró un pago de'
        } $${amount.toFixed(2)} a la cuenta`,
      });

      setPaymentAmount('');
      setPaymentDescription('');
      setShowPaymentForm(false);
      refetch();
      onRefresh?.();
    } catch (error: any) {
      console.error('Error processing movement:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo procesar el movimiento',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  };

  const creditUsagePercent = customer?.credit_limit
    ? ((customer.current_balance || 0) / customer.credit_limit) * 100
    : 0;

  const getBalanceColor = () => {
    if (!customer?.current_balance || customer.current_balance === 0)
      return 'text-muted-foreground';
    return customer.current_balance > 0 ? 'text-destructive' : 'text-green-500';
  };

  if (!customer && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {customer?.name || 'Cargando...'}
            {customer && (
              <Badge variant="outline" className="ml-2">
                {customer.code}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Customer Info Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="text-xs text-muted-foreground">
                  Saldo Actual
                </div>
                <div className={`text-xl font-bold ${getBalanceColor()}`}>
                  {formatCurrency(customer.current_balance || 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="text-xs text-muted-foreground">
                  Límite de Crédito
                </div>
                <div className="text-xl font-bold">
                  {formatCurrency(customer.credit_limit || 0)}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="text-xs text-muted-foreground">
                  Crédito Disponible
                </div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(
                    Math.max(
                      0,
                      (customer.credit_limit || 0) -
                        (customer.current_balance || 0)
                    )
                  )}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <div className="text-xs text-muted-foreground">
                  Total Compras
                </div>
                <div className="text-xl font-bold">{sales.length}</div>
              </div>
            </div>

            {/* Credit Usage Bar */}
            {customer.credit_limit && customer.credit_limit > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uso de Crédito</span>
                  <span className={creditUsagePercent > 80 ? 'text-destructive' : ''}>
                    {creditUsagePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      creditUsagePercent > 80
                        ? 'bg-destructive'
                        : creditUsagePercent > 50
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min(100, creditUsagePercent)}%` }}
                  />
                </div>
              </div>
            )}

            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información
                </TabsTrigger>
                <TabsTrigger
                  value="movements"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Movimientos
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Compras
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {customer.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.tax_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span>CUIT: {customer.tax_id}</span>
                    </div>
                  )}
                  {(customer.address || customer.city) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {[customer.address, customer.city]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Acciones Rápidas</h4>
                  {!showPaymentForm ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowPaymentForm(true)}
                        className="flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Registrar Movimiento
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Monto</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción (opcional)</Label>
                        <Input
                          value={paymentDescription}
                          onChange={(e) =>
                            setPaymentDescription(e.target.value)
                          }
                          placeholder="Descripción del movimiento"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => handlePayment('credit')}
                          disabled={isProcessing}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Cargar Deuda
                        </Button>
                        <Button
                          variant="default"
                          onClick={() => handlePayment('debit')}
                          disabled={isProcessing}
                          className="flex items-center gap-2"
                        >
                          <Minus className="h-4 w-4" />
                          Registrar Pago
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setShowPaymentForm(false);
                            setPaymentAmount('');
                            setPaymentDescription('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="movements" className="pt-4">
                <ScrollArea className="h-[300px]">
                  {movements.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No hay movimientos registrados
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movements.map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="text-sm">
                              {formatDate(movement.created_at || '')}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  movement.type === 'payment'
                                    ? 'default'
                                    : movement.type === 'credit'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {movement.type === 'payment' && (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {movement.type === 'credit' && (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                )}
                                {movement.type === 'sale' && (
                                  <Receipt className="h-3 w-3 mr-1" />
                                )}
                                {movement.type === 'payment'
                                  ? 'Pago'
                                  : movement.type === 'credit'
                                  ? 'Cargo'
                                  : movement.type === 'sale'
                                  ? 'Venta'
                                  : movement.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {movement.description || '-'}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                movement.amount < 0
                                  ? 'text-green-500'
                                  : 'text-destructive'
                              }`}
                            >
                              {movement.amount > 0 ? '+' : ''}
                              {formatCurrency(movement.amount)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(movement.balance_after)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="sales" className="pt-4">
                <ScrollArea className="h-[300px]">
                  {sales.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No hay compras registradas
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>N° Venta</TableHead>
                          <TableHead>Productos</TableHead>
                          <TableHead>Método Pago</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="text-sm">
                              {formatDate(sale.created_at || '')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                #{sale.sale_number}
                              </Badge>
                            </TableCell>
                            <TableCell>{sale.items_count} items</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {sale.payment_method === 'cash'
                                  ? 'Efectivo'
                                  : sale.payment_method === 'card'
                                  ? 'Tarjeta'
                                  : sale.payment_method === 'transfer'
                                  ? 'Transferencia'
                                  : sale.payment_method === 'account'
                                  ? 'Cuenta Cte.'
                                  : sale.payment_method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(sale.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

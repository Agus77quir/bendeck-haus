import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { CustomerDetailDialog } from '@/components/customers/CustomerDetailDialog';
import { useAuthStore } from '@/stores/authStore';
import {
  Search,
  MoreHorizontal,
  Eye,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Users,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Accounts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, isLoading, refetch } = useCustomers(searchTerm);
  const { isAdmin } = useAuthStore();

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  // Filter only customers with account activity (balance != 0 or has credit limit)
  const accountCustomers = customers.filter(
    (c) => (c.current_balance !== 0) || (c.credit_limit && c.credit_limit > 0)
  );

  // Calculate summary stats
  const totalWithDebt = accountCustomers.filter((c) => (c.current_balance || 0) > 0).length;
  const totalWithCredit = accountCustomers.filter((c) => (c.current_balance || 0) < 0).length;
  const totalDebt = accountCustomers.reduce(
    (sum, c) => sum + Math.max(0, c.current_balance || 0),
    0
  );
  const totalCredit = accountCustomers.reduce(
    (sum, c) => sum + Math.abs(Math.min(0, c.current_balance || 0)),
    0
  );
  const totalCreditLimit = accountCustomers.reduce(
    (sum, c) => sum + (c.credit_limit || 0),
    0
  );

  const getBalanceStatus = (customer: Customer) => {
    const balance = customer.current_balance || 0;
    const limit = customer.credit_limit || 0;

    if (balance === 0) return { variant: 'secondary' as const, text: 'Sin saldo' };
    if (balance < 0) return { variant: 'default' as const, text: 'A favor' };
    if (limit > 0 && balance >= limit)
      return { variant: 'destructive' as const, text: 'Límite alcanzado' };
    if (limit > 0 && balance >= limit * 0.8)
      return { variant: 'destructive' as const, text: 'Cerca del límite' };
    return { variant: 'outline' as const, text: 'Con deuda' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Cuentas Corrientes
          </h1>
          <p className="text-muted-foreground">
            Gestión de saldos y movimientos de cuentas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{accountCustomers.length}</p>
              <p className="text-xs text-muted-foreground">Con Cuenta</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <TrendingUp className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWithDebt}</p>
              <p className="text-xs text-muted-foreground">Deudores</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWithCredit}</p>
              <p className="text-xs text-muted-foreground">A Favor</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalDebt)}</p>
              <p className="text-xs text-muted-foreground">Total Deuda</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalCreditLimit)}</p>
              <p className="text-xs text-muted-foreground">Crédito Otorgado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, código o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Límite
              </TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                Disponible
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    Cargando cuentas...
                  </div>
                </TableCell>
              </TableRow>
            ) : accountCustomers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchTerm
                    ? 'No se encontraron cuentas con ese criterio'
                    : 'No hay cuentas corrientes activas'}
                </TableCell>
              </TableRow>
            ) : (
              accountCustomers.map((customer) => {
                const status = getBalanceStatus(customer);
                const available = Math.max(
                  0,
                  (customer.credit_limit || 0) - (customer.current_balance || 0)
                );
                return (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetail(customer)}
                  >
                    <TableCell>
                      <Badge variant="outline">{customer.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {customer.phone || customer.email || '-'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        (customer.current_balance || 0) > 0
                          ? 'text-destructive'
                          : (customer.current_balance || 0) < 0
                          ? 'text-green-500'
                          : ''
                      }`}
                    >
                      {formatCurrency(customer.current_balance || 0)}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(customer.credit_limit || 0)}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell text-primary">
                      {formatCurrency(available)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-popover border-border"
                        >
                          <DropdownMenuItem
                            onClick={() => handleViewDetail(customer)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewDetail(customer)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            Registrar Movimiento
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewDetail(customer)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Estado de Cuenta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        customerId={selectedCustomer?.id || null}
        onRefresh={refetch}
      />
    </div>
  );
};

export default Accounts;

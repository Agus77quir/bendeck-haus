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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomerDetailDialog } from '@/components/customers/CustomerDetailDialog';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { customers, isLoading, refetch } = useCustomers(searchTerm);
  const { isAdmin } = useAuthStore();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(value);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleViewDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('customers')
        .update({ active: false })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast({
        title: 'Cliente eliminado',
        description: 'El cliente fue eliminado correctamente',
      });

      refetch();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el cliente',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
    }
  };

  const confirmDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  // Calculate summary stats
  const totalCustomers = customers.length;
  const customersWithDebt = customers.filter(
    (c) => (c.current_balance || 0) > 0
  ).length;
  const totalDebt = customers.reduce(
    (sum, c) => sum + Math.max(0, c.current_balance || 0),
    0
  );
  const totalCreditLimit = customers.reduce(
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
    return { variant: 'outline' as const, text: 'Con saldo' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gestiona clientes y cuentas corrientes
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setSelectedCustomer(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCustomers}</p>
              <p className="text-xs text-muted-foreground">Total Clientes</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customersWithDebt}</p>
              <p className="text-xs text-muted-foreground">Con Deuda</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(totalDebt)}</p>
              <p className="text-xs text-muted-foreground">Deuda Total</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CreditCard className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {formatCurrency(totalCreditLimit)}
              </p>
              <p className="text-xs text-muted-foreground">Crédito Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, código, email o teléfono..."
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
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right hidden sm:table-cell">
                Límite
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    Cargando clientes...
                  </div>
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  {searchTerm
                    ? 'No se encontraron clientes con ese criterio'
                    : 'No hay clientes registrados'}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const status = getBalanceStatus(customer);
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
                      {customer.email || customer.phone || '-'}
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
                          {isAdmin && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleEdit(customer)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => confirmDelete(customer)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Dialogs */}
      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={selectedCustomer}
        onSuccess={refetch}
      />

      <CustomerDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        customerId={selectedCustomer?.id || null}
        onRefresh={refetch}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará al cliente "{selectedCustomer?.name}". El
              cliente no aparecerá en las listas pero sus datos se conservarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Customers;

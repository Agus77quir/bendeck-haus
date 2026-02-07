import { useState } from 'react';
import { Database as DatabaseIcon, Package, Users, Plus, Search, Edit, Trash2, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCustomers, type Customer } from '@/hooks/useCustomers';
import { useBusinessStore } from '@/stores/businessStore';
import { ProductFormDialog } from '@/components/products/ProductFormDialog';
import { ProductImportDialog } from '@/components/products/ProductImportDialog';
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog';
import { CustomerImportDialog } from '@/components/database/CustomerImportDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState('products');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Products state
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productImportOpen, setProductImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  
  // Customers state
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerImportOpen, setCustomerImportOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerOpen, setDeleteCustomerOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  
  const { products, isLoading: productsLoading, refetch: refetchProducts } = useProducts(productSearch);
  const { customers, isLoading: customersLoading, refetch: refetchCustomers } = useCustomers(customerSearch);
  const { selectedBusiness } = useBusinessStore();

  const businessName = selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff';

  // Product handlers
  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsDeletingProduct(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast.success('Producto eliminado correctamente');
      setDeleteProductOpen(false);
      setProductToDelete(null);
      refetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const handleProductFormClose = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
  };

  // Customer handlers
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerFormOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    
    setIsDeletingCustomer(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ active: false })
        .eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success('Cliente eliminado correctamente');
      setDeleteCustomerOpen(false);
      setCustomerToDelete(null);
      refetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Error al eliminar el cliente');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  const handleCustomerFormClose = () => {
    setCustomerFormOpen(false);
    setEditingCustomer(null);
  };

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-12 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-3">
            <DatabaseIcon className="h-8 w-8 text-primary" />
            Base de Datos
          </h1>
          <p className="text-muted-foreground mt-1">{businessName} - Gestión centralizada de datos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, código..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setProductImportOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importar
                  </Button>
                  <Button onClick={() => setProductFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Producto
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <ScrollArea className="h-[calc(100vh-500px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Imagen</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="text-right">P. Compra</TableHead>
                    <TableHead className="text-right">P. Venta</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                          <span className="text-muted-foreground">Cargando productos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No se encontraron productos</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => {
                      const isLowStock = product.stock <= product.min_stock && product.stock > 0;
                      const isOutOfStock = product.stock === 0;

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="w-10 h-10 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{product.code}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(product.purchase_price))}
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            {formatCurrency(Number(product.sale_price))}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              "font-medium",
                              isOutOfStock && "text-destructive",
                              isLowStock && "text-warning"
                            )}>
                              {product.stock}
                            </span>
                            <span className="text-muted-foreground text-xs ml-1">
                              / min: {product.min_stock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "default"}
                            >
                              {isOutOfStock ? "Sin Stock" : isLowStock ? "Stock Bajo" : "Disponible"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setProductToDelete(product);
                                  setDeleteProductOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, código, CUIT..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCustomerImportOpen(true)} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Importar
                  </Button>
                  <Button onClick={() => setCustomerFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Cliente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <ScrollArea className="h-[calc(100vh-500px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>CUIT/DNI</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead className="text-right">Límite Crédito</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                          <span className="text-muted-foreground">Cargando clientes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-muted-foreground">No se encontraron clientes</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer) => {
                      const hasDebt = (customer.current_balance || 0) > 0;

                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-mono text-sm">{customer.code}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              {customer.city && (
                                <p className="text-xs text-muted-foreground">{customer.city}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{customer.tax_id || '-'}</TableCell>
                          <TableCell className="text-sm">{customer.email || '-'}</TableCell>
                          <TableCell className="text-sm">{customer.phone || '-'}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(customer.credit_limit || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "font-medium",
                              hasDebt && "text-destructive"
                            )}>
                              {formatCurrency(customer.current_balance || 0)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleEditCustomer(customer)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  setCustomerToDelete(customer);
                                  setDeleteCustomerOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialogs */}
      <ProductFormDialog
        open={productFormOpen}
        onOpenChange={handleProductFormClose}
        product={editingProduct}
      />
      <ProductImportDialog
        open={productImportOpen}
        onOpenChange={setProductImportOpen}
        onImportComplete={refetchProducts}
      />

      {/* Customer Dialogs */}
      <CustomerFormDialog
        open={customerFormOpen}
        onOpenChange={handleCustomerFormClose}
        customer={editingCustomer}
        onSuccess={refetchCustomers}
      />
      <CustomerImportDialog
        open={customerImportOpen}
        onOpenChange={setCustomerImportOpen}
        onImportComplete={refetchCustomers}
      />

      {/* Delete Product Confirmation */}
      <AlertDialog open={deleteProductOpen} onOpenChange={setDeleteProductOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{productToDelete?.name}"? 
              Esta acción marcará el producto como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProduct}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isDeletingProduct}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingProduct ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog open={deleteCustomerOpen} onOpenChange={setDeleteCustomerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar "{customerToDelete?.name}"? 
              Esta acción marcará el cliente como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingCustomer}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomer}
              disabled={isDeletingCustomer}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingCustomer ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
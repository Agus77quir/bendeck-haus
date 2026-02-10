import { useState } from 'react';
import { Search, Plus, Package, ScanBarcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { BarcodeScanner } from './BarcodeScanner';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
};

export const ProductSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const { products, isLoading } = useProducts(searchTerm);
  const { addItem, items } = useCartStore();

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    return item?.quantity || 0;
  };

  const handleAddProduct = (product: Product) => {
    if (product.stock <= 0) return;
    addItem(product);
  };

  const handleBarcodeScan = (code: string) => {
    setSearchTerm(code);
    // Find and add product by code
    const product = products.find(p => p.code === code);
    if (product && product.stock > 0) {
      addItem(product);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setScannerOpen(true)}
            title="Escanear código de barras"
          >
            <ScanBarcode className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner 
        open={scannerOpen} 
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
      />

      {/* Products Grid */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Package className="h-12 w-12 mb-2" />
            <p>No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => {
              const cartQty = getCartQuantity(product.id);
              const isLowStock = product.stock <= product.min_stock;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "group relative p-4 rounded-lg border transition-all duration-200",
                    "bg-card hover:bg-accent/50",
                    isOutOfStock && "opacity-60",
                    cartQty > 0 && "border-primary ring-1 ring-primary/20"
                  )}
                >
                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      Stock: {product.stock}
                    </Badge>
                  </div>

                  {/* Cart Quantity Badge */}
                  {cartQty > 0 && (
                    <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {cartQty}
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="pr-16">
                    <p className="text-xs text-muted-foreground font-mono">{product.code}</p>
                    <h4 className="font-medium text-sm line-clamp-2 mt-1">{product.name}</h4>
                  </div>

                  {/* Price & Action */}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(Number(product.sale_price))}
                    </span>
                    <Button
                      size="sm"
                      variant={cartQty > 0 ? "default" : "secondary"}
                      onClick={() => handleAddProduct(product)}
                      disabled={isOutOfStock}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

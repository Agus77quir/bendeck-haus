import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBusinessStore } from '@/stores/businessStore';
import { toast } from 'sonner';
import { ProductImageUpload } from './ProductImageUpload';
import type { Product } from '@/hooks/useProducts';
import type { Database } from '@/integrations/supabase/types';

type BusinessType = Database['public']['Enums']['business_type'];

const productSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  purchase_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  sale_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  stock: z.coerce.number().int().min(0, 'El stock debe ser mayor o igual a 0'),
  min_stock: z.coerce.number().int().min(0, 'El stock mínimo debe ser mayor o igual a 0'),
  business: z.enum(['bendeck_tools', 'lusqtoff'] as const),
  image_url: z.string().nullable().optional(),
  supplier_id: z.string().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export const ProductFormDialog = ({ open, onOpenChange, product }: ProductFormDialogProps) => {
  const { selectedBusiness } = useBusinessStore();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase.from('suppliers').select('id, name').eq('active', true).order('name');
      setSuppliers(data || []);
    };
    fetchSuppliers();
  }, []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      purchase_price: 0,
      sale_price: 0,
      stock: 0,
      min_stock: 5,
      business: (selectedBusiness as BusinessType) || 'bendeck_tools',
      image_url: null,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        description: product.description || '',
        purchase_price: Number(product.purchase_price),
        sale_price: Number(product.sale_price),
        stock: product.stock,
        min_stock: product.min_stock,
        business: product.business,
        image_url: product.image_url,
      });
      setImageUrl(product.image_url);
    } else {
      form.reset({
        code: '',
        name: '',
        description: '',
        purchase_price: 0,
        sale_price: 0,
        stock: 0,
        min_stock: 5,
        business: (selectedBusiness as BusinessType) || 'bendeck_tools',
        image_url: null,
      });
      setImageUrl(null);
    }
  }, [product, selectedBusiness, form]);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (product) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            code: values.code,
            name: values.name,
            description: values.description || null,
            purchase_price: values.purchase_price,
            sale_price: values.sale_price,
            stock: values.stock,
            min_stock: values.min_stock,
            business: values.business,
            image_url: imageUrl,
          })
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Producto actualizado correctamente');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert({
            code: values.code,
            name: values.name,
            description: values.description || null,
            purchase_price: values.purchase_price,
            sale_price: values.sale_price,
            stock: values.stock,
            min_stock: values.min_stock,
            business: values.business,
            image_url: imageUrl,
          });

        if (error) throw error;
        toast.success('Producto creado correctamente');
      }

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Error al guardar el producto');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? 'Modifica los datos del producto existente' 
              : 'Completa los datos para crear un nuevo producto'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Image Upload */}
            <ProductImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              productCode={form.watch('code')}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="PROD-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Negocio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar negocio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bendeck_tools">Bendeck Tools</SelectItem>
                        <SelectItem value="lusqtoff">Lüsqtoff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descripción del producto..." 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchase_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Compra (ARS)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Venta (ARS)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Actual</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting 
                  ? 'Guardando...' 
                  : product ? 'Actualizar' : 'Crear Producto'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

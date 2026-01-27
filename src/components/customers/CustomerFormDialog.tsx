import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import type { Customer } from '@/hooks/useCustomers';
import type { Database } from '@/integrations/supabase/types';

type BusinessType = Database['public']['Enums']['business_type'];

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess: () => void;
}

export const CustomerFormDialog = ({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) => {
  const { toast } = useToast();
  const { selectedBusiness } = useBusinessStore();
  const { isAdmin } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    tax_id: '',
    credit_limit: 0,
    business: (selectedBusiness || 'bendeck_tools') as BusinessType,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        tax_id: customer.tax_id || '',
        credit_limit: customer.credit_limit || 0,
        business: customer.business,
      });
    } else {
      setFormData({
        code: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        tax_id: '',
        credit_limit: 0,
        business: (selectedBusiness || 'bendeck_tools') as BusinessType,
      });
    }
  }, [customer, selectedBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Código y nombre son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (customer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            code: formData.code.trim(),
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            city: formData.city.trim() || null,
            tax_id: formData.tax_id.trim() || null,
            credit_limit: formData.credit_limit,
            business: formData.business,
          })
          .eq('id', customer.id);

        if (error) throw error;

        toast({
          title: 'Cliente actualizado',
          description: 'Los datos del cliente se actualizaron correctamente',
        });
      } else {
        // Create new customer
        const { error } = await supabase.from('customers').insert({
          code: formData.code.trim(),
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          tax_id: formData.tax_id.trim() || null,
          credit_limit: formData.credit_limit,
          business: formData.business,
          current_balance: 0,
        });

        if (error) throw error;

        toast({
          title: 'Cliente creado',
          description: 'El cliente se creó correctamente',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo guardar el cliente',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="CLI-001"
                required
              />
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="business">Negocio</Label>
                <Select
                  value={formData.business}
                  onValueChange={(value: BusinessType) =>
                    setFormData((prev) => ({ ...prev, business: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="bendeck_tools">Bendeck Tools</SelectItem>
                    <SelectItem value="lusqtoff">Lüsqtoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre / Razón Social *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+54 11 1234-5678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_id">CUIT / DNI</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tax_id: e.target.value }))
                }
                placeholder="20-12345678-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_limit">Límite de Crédito</Label>
              <Input
                id="credit_limit"
                type="number"
                min="0"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    credit_limit: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Calle y número"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, city: e.target.value }))
              }
              placeholder="Ciudad"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando...'
                : customer
                ? 'Actualizar'
                : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

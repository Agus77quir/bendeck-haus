import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, Plus, Truck, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  business: 'bendeck_tools' | 'lusqtoff';
  active: boolean | null;
  created_at: string | null;
}

const emptyForm = {
  name: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  notes: '',
  business: 'bendeck_tools' as 'bendeck_tools' | 'lusqtoff',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const { selectedBusiness } = useBusinessStore();
  const { isAdmin } = useAuthStore();

  const fetchSuppliers = async () => {
    setIsLoading(true);
    let query = supabase.from('suppliers').select('*').eq('active', true).order('name');
    if (selectedBusiness && !isAdmin) {
      query = query.eq('business', selectedBusiness);
    }
    const { data, error } = await query;
    if (error) { console.error(error); } else { setSuppliers(data || []); }
    setIsLoading(false);
  };

  useEffect(() => { fetchSuppliers(); }, [selectedBusiness, isAdmin]);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, business: (selectedBusiness as 'bendeck_tools' | 'lusqtoff') || 'bendeck_tools' });
    setDialogOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact_name: s.contact_name || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      city: s.city || '',
      notes: s.notes || '',
      business: s.business,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    const payload = {
      name: form.name,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      notes: form.notes || null,
      business: form.business,
    };
    if (editing) {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', editing.id);
      if (error) { toast.error('Error al actualizar'); return; }
      toast.success('Proveedor actualizado');
    } else {
      const { error } = await supabase.from('suppliers').insert(payload);
      if (error) { toast.error('Error al crear'); return; }
      toast.success('Proveedor creado');
    }
    setDialogOpen(false);
    fetchSuppliers();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('suppliers').update({ active: false }).eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    toast.success('Proveedor eliminado');
    fetchSuppliers();
  };

  return (
    <div className="space-y-6 md:pl-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-12 md:pt-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-display flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            Proveedores
          </h1>
          <p className="text-muted-foreground mt-1">{suppliers.length} proveedores registrados</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Proveedor
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar proveedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No se encontraron proveedores</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  {s.contact_name && <p className="text-sm text-muted-foreground">{s.contact_name}</p>}
                </div>
                <Badge variant="outline" className="text-xs">
                  {s.business === 'bendeck_tools' ? 'Bendeck' : 'Lüsqtoff'}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {s.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{s.phone}</div>}
                {s.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{s.email}</div>}
                {s.address && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{s.address}{s.city ? `, ${s.city}` : ''}</div>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)} className="gap-1">
                  <Edit className="h-3 w-3" /> Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="text-destructive gap-1">
                  <Trash2 className="h-3 w-3" /> Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
            <DialogDescription>{editing ? 'Modifica los datos del proveedor' : 'Completa los datos del nuevo proveedor'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del proveedor" />
            </div>
            <div>
              <Label>Persona de Contacto</Label>
              <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Nombre de contacto" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+54..." />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@..." />
              </div>
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Dirección" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ciudad</Label>
                <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Ciudad" />
              </div>
              <div>
                <Label>Negocio</Label>
                <Select value={form.business} onValueChange={v => setForm(f => ({ ...f, business: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bendeck_tools">Bendeck Tools</SelectItem>
                    <SelectItem value="lusqtoff">Lüsqtoff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionales..." className="resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

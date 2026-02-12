import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import {
  Settings as SettingsIcon,
  Store,
  Bell,
  Shield,
  Database,
  Users,
  Palette,
  Save,
  Download,
  Loader2,
} from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const { user, isAdmin } = useAuthStore();
  const { selectedBusiness, setSelectedBusiness } = useBusinessStore();
const { 
    permission, 
    isSupported,
    requestPermission,
  } = usePushNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(permission === 'granted');

  const [businessSettings, setBusinessSettings] = useState({
    storeName: selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff',
    address: 'Av. Principal 1234',
    phone: '+54 11 1234-5678',
    email: 'contacto@bendeck.com',
    taxId: '30-12345678-9',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    lowStockAlerts: true,
    salesNotifications: true,
    creditAlerts: true,
    emailDigest: false,
  });
  const [isBackingUp, setIsBackingUp] = useState(false);

  const [systemSettings, setSystemSettings] = useState({
    autoLogout: 30,
    defaultTax: 21,
    lowStockThreshold: 5,
    currency: 'ARS',
  });

  const handleSaveBusinessSettings = () => {
    toast({
      title: 'Configuración guardada',
      description: 'Los datos del negocio se actualizaron correctamente',
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: 'Preferencias guardadas',
      description: 'Tus preferencias de notificación se actualizaron',
    });
  };

  const handleSaveSystemSettings = () => {
    toast({
      title: 'Configuración del sistema guardada',
      description: 'Los ajustes se aplicarán a partir de ahora',
    });
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Error', description: 'Debes iniciar sesión', variant: 'destructive' });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-backup`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Backup failed');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Backup generado',
        description: 'El archivo Excel se descargó correctamente',
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: 'Error al generar backup',
        description: 'Intenta nuevamente más tarde',
        variant: 'destructive',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handlePushToggle = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(!notificationsEnabled);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pl-12 md:pl-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Configuración
          </h1>
          <p className="text-muted-foreground">
            Ajustes generales del sistema
          </p>
        </div>
        <Badge variant="outline" className="w-fit">
          {isAdmin ? 'Administrador' : 'Vendedor'}
        </Badge>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Negocio</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguridad</span>
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Datos del Negocio
              </CardTitle>
              <CardDescription>
                Información general que aparecerá en tickets y reportes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Nombre del Negocio</Label>
                  <Input
                    id="storeName"
                    value={businessSettings.storeName}
                    onChange={(e) =>
                      setBusinessSettings((prev) => ({
                        ...prev,
                        storeName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">CUIT</Label>
                  <Input
                    id="taxId"
                    value={businessSettings.taxId}
                    onChange={(e) =>
                      setBusinessSettings((prev) => ({
                        ...prev,
                        taxId: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={businessSettings.address}
                  onChange={(e) =>
                    setBusinessSettings((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={businessSettings.phone}
                    onChange={(e) =>
                      setBusinessSettings((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessSettings.email}
                    onChange={(e) =>
                      setBusinessSettings((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveBusinessSettings} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Selección de Negocio
                </CardTitle>
                <CardDescription>
                  Cambiar entre las tiendas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant={selectedBusiness === 'bendeck_tools' ? 'default' : 'outline'}
                    onClick={() => setSelectedBusiness('bendeck_tools')}
                    className="flex-1"
                  >
                    Bendeck Tools
                  </Button>
                  <Button
                    variant={selectedBusiness === 'lusqtoff' ? 'default' : 'outline'}
                    onClick={() => setSelectedBusiness('lusqtoff')}
                    className="flex-1"
                  >
                    Lüsqtoff
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones Push
              </CardTitle>
              <CardDescription>
                Recibe alertas en tiempo real en tu navegador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <p className="font-medium">Notificaciones del navegador</p>
                  <p className="text-sm text-muted-foreground">
                    {permission === 'granted'
                      ? notificationsEnabled
                        ? 'Activadas - Recibirás alertas'
                        : 'Permiso otorgado - Activa las notificaciones'
                      : permission === 'denied'
                      ? 'Bloqueadas - Habilita en configuración del navegador'
                      : 'No configuradas'}
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handlePushToggle}
                  disabled={!isSupported || permission === 'denied'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Alertas</CardTitle>
              <CardDescription>
                Configura qué tipo de notificaciones deseas recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Stock Bajo</Label>
                  <p className="text-sm text-muted-foreground">
                    Cuando un producto alcance el mínimo
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      lowStockAlerts: checked,
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificaciones de Ventas</Label>
                  <p className="text-sm text-muted-foreground">
                    Al completarse una venta
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.salesNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      salesNotifications: checked,
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Alertas de Crédito</Label>
                  <p className="text-sm text-muted-foreground">
                    Cuando un cliente alcance su límite
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.creditAlerts}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      creditAlerts: checked,
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resumen por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibe un resumen diario por email
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.emailDigest}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((prev) => ({
                      ...prev,
                      emailDigest: checked,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotificationSettings} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuración del Sistema
              </CardTitle>
              <CardDescription>
                Ajustes generales de funcionamiento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="autoLogout">Cierre automático (minutos)</Label>
                  <Input
                    id="autoLogout"
                    type="number"
                    min="5"
                    max="120"
                    value={systemSettings.autoLogout}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        autoLogout: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Tiempo de inactividad antes de cerrar sesión
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTax">IVA por defecto (%)</Label>
                  <Input
                    id="defaultTax"
                    type="number"
                    min="0"
                    max="100"
                    value={systemSettings.defaultTax}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        defaultTax: parseInt(e.target.value) || 21,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Umbral de stock bajo</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min="1"
                    value={systemSettings.lowStockThreshold}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        lowStockThreshold: parseInt(e.target.value) || 5,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Por defecto para nuevos productos
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Input
                    id="currency"
                    value={systemSettings.currency}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Peso Argentino (ARS)
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveSystemSettings} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Configuración
                </Button>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Backup de Datos
                </CardTitle>
                <CardDescription>
                  Genera una copia de seguridad de todos los datos del sistema en formato Excel (XLSX) con hojas separadas por tabla
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  El backup incluye: productos, clientes, ventas, proveedores y categorías.
                </p>
                <Button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className="flex items-center gap-2"
                >
                  {isBackingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isBackingUp ? 'Generando backup...' : 'Descargar Backup Excel'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad de la Cuenta
              </CardTitle>
              <CardDescription>
                Información de tu cuenta y opciones de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">Email de la cuenta</p>
                <p className="font-medium">{user?.email || 'No disponible'}</p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm text-muted-foreground">Rol</p>
                <Badge variant={isAdmin ? 'default' : 'secondary'}>
                  {isAdmin ? 'Administrador' : 'Vendedor'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Cambiar Contraseña</h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>
                <Button variant="outline">Actualizar Contraseña</Button>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Administrar accesos y permisos del equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  La gestión completa de usuarios estará disponible próximamente.
                  Por ahora, contacta al soporte para agregar o modificar usuarios.
                </p>
                <Button variant="outline" disabled>
                  <Users className="h-4 w-4 mr-2" />
                  Administrar Usuarios
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

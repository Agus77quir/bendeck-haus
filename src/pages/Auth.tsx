import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessStore } from "@/stores/businessStore";
import { GearIcon } from "@/components/icons/GearIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email inválido");
const passwordSchema = z.string().min(6, "La contraseña debe tener al menos 6 caracteres");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const selectedBusiness = useBusinessStore((state) => state.selectedBusiness);
  
  // Only login mode - no registration allowed
  const isLogin = true;
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; fullName?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch {
      newErrors.email = "Email inválido";
    }
    
    try {
      passwordSchema.parse(password);
    } catch {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }
    
    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = "El nombre es requerido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Error de autenticación",
              description: "Email o contraseña incorrectos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
          return;
        }
        
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
        
        navigate("/dashboard");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const businessName = selectedBusiness === 'bendeck_tools' ? 'Bendeck Tools' : 'Lüsqtoff';

  return (
    <div className="min-h-screen bg-background gear-pattern flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated background gears */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <GearIcon 
          className="absolute -top-20 -left-20 w-80 h-80 text-primary/5" 
          animate 
        />
        <GearIcon 
          className="absolute -bottom-32 -right-32 w-96 h-96 text-primary/5" 
          animate 
          style={{ animationDirection: 'reverse' }}
        />
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>

        <div className="glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <GearIcon className="w-10 h-10 text-primary" />
              <h1 className="text-2xl font-display font-bold">
                <span className="text-foreground">BENDECK</span>
                <span className="text-gradient-orange ml-1">HAUS</span>
              </h1>
            </div>
            {selectedBusiness && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm text-primary font-medium">{businessName}</span>
              </div>
            )}
            <h2 className="text-xl font-semibold text-foreground mt-4">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin 
                ? "Ingresa tus credenciales para acceder" 
                : "Completa los datos para registrarte"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Nombre Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border focus:border-primary"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border focus:border-primary"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-secondary/50 border-border focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-industrial text-primary-foreground py-6"
            >
              {isLoading ? (
                <GearIcon className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                "Iniciar Sesión"
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Auth;

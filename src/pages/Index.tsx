import { useNavigate } from "react-router-dom";
import { GearIcon } from "@/components/icons/GearIcon";
import { WrenchIcon } from "@/components/icons/WrenchIcon";
import { DrillIcon } from "@/components/icons/DrillIcon";
import { useBusinessStore, BusinessType } from "@/stores/businessStore";

const Index = () => {
  const navigate = useNavigate();
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);

  const handleBusinessSelect = (business: BusinessType) => {
    setSelectedBusiness(business);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background gear-pattern flex flex-col items-center justify-center relative overflow-hidden">
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
        <GearIcon 
          className="absolute top-1/4 right-10 w-40 h-40 text-primary/3" 
          animate 
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center mb-12">
        <div className="flex items-center justify-center gap-4 mb-6">
          <GearIcon className="w-16 h-16 text-primary orange-glow-sm" />
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
            <span className="text-foreground">BENDECK</span>
            <span className="text-gradient-orange ml-3">HAUS</span>
          </h1>
          <GearIcon className="w-16 h-16 text-primary orange-glow-sm" style={{ transform: 'scaleX(-1)' }} />
        </div>
        <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto">
          Sistema de Ventas Mayorista de Herramientas
        </p>
      </div>

      {/* Business selector cards */}
      <div className="relative z-10 flex flex-col md:flex-row gap-8 px-4">
        {/* Bendeck Tools Card */}
        <button
          onClick={() => handleBusinessSelect('bendeck_tools')}
          className="group glass-card p-8 md:p-12 w-full md:w-80 transition-all duration-500 hover:scale-105 hover:orange-glow cursor-pointer"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-dark flex items-center justify-center group-hover:animate-pulse-orange transition-all">
                <WrenchIcon className="w-12 h-12 text-primary-foreground" />
              </div>
              <GearIcon 
                className="absolute -bottom-2 -right-2 w-10 h-10 text-primary/60 group-hover:text-primary transition-colors" 
                animate 
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                BENDECK TOOLS
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Herramientas Manuales y Eléctricas
              </p>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-primary to-orange-light transition-all duration-500" />
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden md:flex items-center">
          <div className="w-px h-32 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Lüsqtoff Card */}
        <button
          onClick={() => handleBusinessSelect('lusqtoff')}
          className="group glass-card p-8 md:p-12 w-full md:w-80 transition-all duration-500 hover:scale-105 hover:orange-glow cursor-pointer"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-orange-dark flex items-center justify-center group-hover:animate-pulse-orange transition-all">
                <DrillIcon className="w-12 h-12 text-primary-foreground" />
              </div>
              <GearIcon 
                className="absolute -bottom-2 -right-2 w-10 h-10 text-primary/60 group-hover:text-primary transition-colors" 
                animate 
                style={{ animationDirection: 'reverse' }}
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                LÜSQTOFF
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                Herramientas Manuales y Eléctricas
              </p>
            </div>
            <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
              <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-primary to-orange-light transition-all duration-500" />
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-16 text-center">
        <p className="text-muted-foreground/60 text-sm">
          © 2024 Bendeck Haus. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Index;

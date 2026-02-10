import { useNavigate } from "react-router-dom";
import { GearIcon } from "@/components/icons/GearIcon";
import { useBusinessStore, BusinessType } from "@/stores/businessStore";
import bendeckToolsLogo from "@/assets/bendeck-tools-logo.png";
import lusqtoffLogo from "@/assets/lusqtoff-logo.png";
const Index = () => {
  const navigate = useNavigate();
  const setSelectedBusiness = useBusinessStore((state) => state.setSelectedBusiness);

  const handleBusinessSelect = (business: BusinessType) => {
    setSelectedBusiness(business);
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">

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
      <div className="relative z-10 flex flex-col md:flex-row gap-10 px-4">
        {/* Bendeck Tools Card */}
        <button
          onClick={() => handleBusinessSelect('bendeck_tools')}
          className="group glass-card p-4 w-full md:w-[360px] transition-all duration-500 hover:scale-105 hover:orange-glow cursor-pointer"
        >
          <div className="flex flex-col items-center">
          <div className="w-full h-48 md:h-56 flex items-center justify-center overflow-hidden rounded-xl p-2">
              <img 
                src={bendeckToolsLogo} 
                alt="Bendeck Tools Logo" 
                className="w-[95%] h-[95%] object-contain transition-all duration-300 group-hover:scale-105"
              />
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-4">
              <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-primary to-orange-light transition-all duration-500" />
            </div>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden md:flex items-center">
          <div className="w-px h-48 bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        </div>

        {/* Lüsqtoff Card */}
        <button
          onClick={() => handleBusinessSelect('lusqtoff')}
          className="group glass-card p-4 w-full md:w-[360px] transition-all duration-500 hover:scale-105 hover:orange-glow cursor-pointer"
        >
          <div className="flex flex-col items-center">
          <div className="w-full h-48 md:h-56 flex items-center justify-center overflow-hidden rounded-xl">
              <img 
                src={lusqtoffLogo} 
                alt="Lüsqtoff Logo" 
                className="max-w-full max-h-full object-contain transition-all duration-300 group-hover:scale-105"
              />
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-4">
              <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-primary to-orange-light transition-all duration-500" />
            </div>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-16 text-center">
        <p className="text-muted-foreground/60 text-sm">
          © 2026 Bendeck Haus. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default Index;

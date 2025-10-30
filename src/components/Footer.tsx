import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/image/logo1.png";

// ... existing code ...

const Footer = () => {
  return (
    <footer className="py-12 px-4 bg-card border-t border-border">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between gap-8 md:gap-12">
          <div className="md:max-w-md">
            <div className="flex items-center space-x-2 mb-4">
              <img className='h-11 w-11' src={logoImage} alt="Logo" />
              <span className="text-lg font-bold">Sistema Pricing Inteligente</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Plataforma de datos analíticos para el sector retail.
              Datos reales, que ayudan entender como se forma el precio, con el fin de optimizar estrategias.
            </p>
            <div className="flex space-x-2">
              <Badge variant="outline">v1.0.0</Badge>
              <Badge variant="outline">Beta</Badge>
            </div>
          </div>

          <div className="md:text-right">
            <h3 className="font-semibold mb-4">Paginas Importantes</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/chatbot" className="hover:text-primary transition-colors">
                  Chatbot IA
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-primary transition-colors">
                  Dashboard Analítico
                </Link>
              </li>
              <li>
                <a href="https://github.com/Pricing-Inteligente/Front.git" className="hover:text-primary transition-colors">
                  Documentación
                </a>
              </li>
              <li>
                <Link to="/support" className="hover:text-primary transition-colors">
                  Soporte
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary transition-colors">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Sistema Pricing Inteligente. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

// ... existing code ...

export default Footer;


import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Bot, 
  BarChart3, 
  Database, 
  Zap, 
  Shield, 
  Globe, 
  Brain,
  ArrowRight,
  MessageSquare,
  TrendingUp,
  Search,
  LogIn,
  UserPlus,
  HelpCircle
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Sistema Pricing Inteligente
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/support">
              <Button variant="ghost" size="sm">
                <HelpCircle className="h-4 w-4 mr-2" />
                Soporte
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="default" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-2">
            🚀 Análisis Inteligente de Retail
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
            Datos Analíticos
            <br />
            en Tiempo Real
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Chatbot y dashboard proveedor de datos analíticos a tiempo real 
            dedicado al área de retail en distintos países. Potencia tu negocio 
            con inteligencia artificial avanzada.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/chatbot">
              <Button size="lg" variant="hero" className="min-w-48">
                <MessageSquare className="mr-2 h-5 w-5" />
                Probar Chatbot
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="analytics" className="min-w-48">
                <BarChart3 className="mr-2 h-5 w-5" />
                Ir al Dashboard
              </Button>
            </Link>
          </div>

          {/* Auth buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link to="/login">
              <Button variant="outline" size="sm" className="min-w-32">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="sm" className="min-w-32">
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Cuenta
              </Button>
            </Link>
            <Link to="/support">
              <Button variant="ghost" size="sm" className="min-w-32">
                <HelpCircle className="mr-2 h-4 w-4" />
                Ayuda
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth">
              <CardContent className="p-6 text-center">
                <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">IA Conversacional</h3>
                <p className="text-sm text-muted-foreground">
                  Chatbot inteligente con análisis de confianza y evidencias
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Avanzado</h3>
                <p className="text-sm text-muted-foreground">
                  Métricas en tiempo real y visualizaciones interactivas
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth">
              <CardContent className="p-6 text-center">
                <Database className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Datos Precisos</h3>
                <p className="text-sm text-muted-foreground">
                  Información actualizada del sector retail por países
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">¿Cómo Funciona?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tres pasos simples para acceder a insights inteligentes de retail
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-primary">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Consulta Natural</h3>
              <p className="text-muted-foreground">
                Realiza preguntas en lenguaje natural sobre datos de retail, 
                precios y tendencias del mercado.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-secondary">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Procesamiento IA</h3>
              <p className="text-muted-foreground">
                Nuestro sistema analiza tu consulta y busca información 
                relevante con modelos de inteligencia artificial avanzados.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-gradient-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Insights Accionables</h3>
              <p className="text-muted-foreground">
                Recibe respuestas precisas con evidencias, métricas de confianza 
                y visualizaciones para tomar mejores decisiones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tecnologías de Vanguardia</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Construido con las mejores tecnologías para garantizar rendimiento, 
              escalabilidad y confiabilidad.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "React 18", icon: "⚛️", description: "Frontend moderno" },
              { name: "Node.js", icon: "🟢", description: "Backend robusto" },
              { name: "MongoDB", icon: "🍃", description: "Base de datos" },
              { name: "TypeScript", icon: "📘", description: "Tipado fuerte" },
              { name: "Express", icon: "🚀", description: "API REST" },
              { name: "TailwindCSS", icon: "🎨", description: "Diseño moderno" },
              { name: "JWT", icon: "🔐", description: "Autenticación" },
              { name: "Recharts", icon: "📊", description: "Visualizaciones" },
            ].map((tech, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-elevation transition-smooth border-0 bg-gradient-card">
                <div className="text-3xl mb-3">{tech.icon}</div>
                <h3 className="font-semibold mb-1">{tech.name}</h3>
                <p className="text-sm text-muted-foreground">{tech.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para Transformar tu Análisis de Retail?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Únete a la revolución de datos inteligentes y toma decisiones 
            más informadas para tu negocio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chatbot">
              <Button size="lg" variant="secondary" className="min-w-48">
                <MessageSquare className="mr-2 h-5 w-5" />
                Comenzar Ahora
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="min-w-48 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Globe className="mr-2 h-5 w-5" />
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">Sistema Pricing Inteligente</span>
              </div>
              <p className="text-muted-foreground mb-4 max-w-md">
                Plataforma de análisis inteligente para el sector retail. 
                Datos precisos, decisiones informadas, resultados excepcionales.
              </p>
              <div className="flex space-x-2">
                <Badge variant="outline">v1.0.0</Badge>
                <Badge variant="outline">Beta</Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Productos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/chatbot" className="hover:text-primary transition-colors">Chatbot IA</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard Analytics</Link></li>
                <li><a href="#" className="hover:text-primary transition-colors">API REST</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentación</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Documentación</a></li>
                <li><Link to="/support" className="hover:text-primary transition-colors">Soporte</Link></li>
                <li><Link to="/login" className="hover:text-primary transition-colors">Iniciar Sesión</Link></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">Registrarse</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Sistema Pricing Inteligente. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
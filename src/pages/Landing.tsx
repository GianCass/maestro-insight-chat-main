import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UserAvatarLink from "@/components/UserAvatarLink";
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
  HelpCircle,
  Network,
  Layers,
  FileSearch,
  LineChart,
  Sparkles
} from "lucide-react";
import landingImage from "@/image/landing.jpg";
import logoImage from "@/image/logo1.png";
import Footer from "@/components/Footer";

const Landing = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img className='h-10 w-10' src={logoImage} alt="Logo" />
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Sistema Pricing Inteligente
            </span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              // Si está logueado, mostrar solo el avatar que lleva a Settings
              <>
                <Link to="/support">
                  <Button variant="ghost" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Soporte
                  </Button>
                </Link>
              <UserAvatarLink />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm scale-105"
          style={{ backgroundImage: `url(${landingImage})` }}
        ></div>

        {/* Capa oscura semitransparente para mejorar contraste */}
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="container mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-2">
            Análisis Inteligente de Retail
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
            Datos Analíticos
            <br />
            en Tiempo Real
          </h1>

          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Chatbot proveedor de datos analíticos en tiempo real
            dedicado a los retails Latinoamericanos. Potencia tu negocio
            con IA avanzada y datos.
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
              <Button variant="ghost" size="sm" className="min-w-32 bg-white/20 hover:bg-white/30 text-white border border-white/30">
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
                  Chatbot inteligente con reportes avanzados para pricing inteligente y evidencias
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analitica Avanzada</h3>
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
                  Información actualizada del sector retail por países para diversos productos
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
                Realiza preguntas en lenguaje natural sobre datos de productos de retail,
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
                relevante con modelos de IA avanzados.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Insights Accionables</h3>
              <p className="text-muted-foreground">
                Recibe respuestas precisas con evidencias
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
              { name: "Python", icon: "🐍", description: "Logica de negocio" },
              { name: "PlotlyDash", icon: "📊", description: "Visualizaciones dinamicas" },
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

      {/* How SPI Works */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">¿Cómo Funciona el Sistema?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una arquitectura inteligente basada en IA y análisis de datos avanzado
            </p>
          </div>

          {/* First Row - Data Processing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-6">
              <div className="bg-gradient-primary w-14 h-14 rounded-lg flex items-center justify-center mb-4 shadow-primary">
                <Network className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Extracción de Información</h3>
              <p className="text-muted-foreground leading-relaxed">
                Extracción de información desde múltiples páginas y fuentes previamente identificadas
              </p>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-6">
              <div className="bg-gradient-secondary w-14 h-14 rounded-lg flex items-center justify-center mb-4 shadow-secondary">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Limpieza y Estructuración</h3>
              <p className="text-muted-foreground leading-relaxed">
                Limpieza y estructuración de los datos con apoyo de modelos LLM para garantizar precisión
              </p>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-6">
              <div className="bg-gradient-accent w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Almacenamiento Vectorial</h3>
              <p className="text-muted-foreground leading-relaxed">
                Almacenamiento y vectorización de datos estructurados para conformar una base de conocimiento sólida
              </p>
            </Card>
          </div>


          {/* Second Row - Advanced Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-8">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-primary w-14 h-14 rounded-lg flex items-center justify-center shadow-primary flex-shrink-0">
                  <FileSearch className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Modelo RAG LLM</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Con esta base de conocimiento, el sistema alimenta un modelo RAG LLM,
                    que permite realizar consultas explicativas y contextuales sobre los datos.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>Reduce errores y alucinaciones, mejorando la precisión</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-8">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-secondary w-14 h-14 rounded-lg flex items-center justify-center shadow-secondary flex-shrink-0">
                  <LineChart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Descomposición de Precios</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    SPI utiliza un modelo de descomposición de precios,
                    que relaciona el grado de influencia de los factores macroeconómicos sobre los productos.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-secondary">
                    <TrendingUp className="h-4 w-4" />
                    <span>Análisis de factores macroeconómicos</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Section - Visualizations and Interaction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-8">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-accent w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Visualizaciones Dinámicas</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Cuenta con un módulo de visualizaciones dinámicas, que se generan de forma personalizada
                    para cada interacción con el chatbot.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-card border-0 shadow-elevation hover:shadow-glow transition-smooth p-8">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-hero w-14 h-14 rounded-lg flex items-center justify-center shadow-glow flex-shrink-0">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3">Interacción Integrada</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Los usuarios pueden interactuar con el chatbot para realizar consultas específicas y visualizar
                    resultados en tiempo real dentro del dashboard, integrando análisis conversacional y visual.
                  </p>
                </div>
              </div>
            </Card>
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
      <Footer />
    </div>
  );
};

export default Landing;
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { sendDashboardQuery, sendDashboardQueryStream } from "@/api/dashboard";
import {
  Home,
  TrendingUp,
  Users,
  Clock,
  Target,
  Download,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  MessageSquare,
  Globe,
  Database,
  Zap,
  Brain
} from "lucide-react";
import UserAvatarLink from "@/components/UserAvatarLink";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';
import Footer from "@/components/Footer";
import logoImage from "@/image/logo1.png";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCountry, setSelectedCountry] = useState('all');

  useEffect(() => {
    document.title = "Dashboard General - SPI";
  }, []);

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // Dashboard query functionality
  const [queryText, setQueryText] = useState('');
  const [queryThreshold, setQueryThreshold] = useState([0.7]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryChart, setQueryChart] = useState<any>(null);

  // Mock data
  const kpiData = {
    totalQueries: 15427,
    noDataPercentage: 12.3,
    averageLatency: 245,
    p95Latency: 1200,
    evidenceClickthrough: 34.7
  };

  const timeseriesData = [
    { time: '00:00', queries: 120, latency: 200 },
    { time: '04:00', queries: 89, latency: 180 },
    { time: '08:00', queries: 350, latency: 250 },
    { time: '12:00', queries: 520, latency: 300 },
    { time: '16:00', queries: 480, latency: 275 },
    { time: '20:00', queries: 310, latency: 220 }
  ];

  const intentData = [
    { intent: 'Consulta Precios', count: 4500, percentage: 35 },
    { intent: 'Análisis Mercado', count: 3200, percentage: 25 },
    { intent: 'Comparar Productos', count: 2800, percentage: 22 },
    { intent: 'Tendencias', count: 1500, percentage: 12 },
    { intent: 'Otros', count: 800, percentage: 6 }
  ];

  const productData = [
    { product: 'Pan de molde', queries: 229, relevance: 11.28 },
    { product: 'Leche liquida', queries: 210, relevance: 10.34 },
    { product: 'Arroz', queries: 196, relevance: 9.65 },
    { product: 'Pasta seca', queries: 174, relevance: 8.57 },
    { product: 'Cafe molido', queries: 162, relevance: 7.98 },
    { product: 'Azucar', queries: 161, relevance: 7.93 },
    { product: 'Huevos', queries: 137, relevance: 6.75 },
    { product: 'Refrescos de cola', queries: 114, relevance: 5.61 },
    { product: 'Aceite vegetal', queries: 104, relevance: 5.12 },
    { product: 'Pollo entero', queries: 93, relevance: 4.58 },
    { product: 'Papas', queries: 79, relevance: 3.89 },
    { product: 'Frijoles', queries: 72, relevance: 3.55 },
    { product: 'Queso blando', queries: 67, relevance: 3.30 },
    { product: 'Cerveza', queries: 54, relevance: 2.66 },
    { product: 'Harina de trigo', queries: 47, relevance: 2.31 },
    { product: 'Atun en lata', queries: 46, relevance: 2.26 },
    { product: 'Tomates', queries: 35, relevance: 1.72 },
    { product: 'Cebolla', queries: 22, relevance: 1.08 },
    { product: 'Banano', queries: 16, relevance: 0.79 },
    { product: 'Manzanas', queries: 13, relevance: 0.64 },
  ];

  const sessionsData = [
    { id: '1', timestamp: '2024-01-15 14:30', intent: 'Consulta Precios', country: 'España', confidence: 0.92 },
    { id: '2', timestamp: '2024-01-15 14:28', intent: 'Análisis Mercado', country: 'México', confidence: 0.87 },
    { id: '3', timestamp: '2024-01-15 14:25', intent: 'Comparar Productos', country: 'Argentina', confidence: 0.95 },
    { id: '4', timestamp: '2024-01-15 14:22', intent: 'Tendencias', country: 'Colombia', confidence: 0.78 },
    { id: '5', timestamp: '2024-01-15 14:20', intent: 'Consulta Precios', country: 'España', confidence: 0.89 }
  ];

  const dataArgentina = [
  { country: "Argentina", product: "Azucar", score: 23 },
  { country: "Argentina", product: "Pan de molde", score: 25 },
  { country: "Argentina", product: "Harina de trigo", score: 25 },
  { country: "Argentina", product: "Huevos", score: 15 },
  { country: "Argentina", product: "Leche liquida", score: 25 },
  { country: "Argentina", product: "Papas", score: 10 },
  { country: "Argentina", product: "Pasta seca", score: 25 },
  { country: "Argentina", product: "Pollo entero", score: 10 },
  { country: "Argentina", product: "Queso blando", score: 25 },
  { country: "Argentina", product: "Refrescos de cola", score: 25 },
  { country: "Argentina", product: "Tomates", score: 10 },
  ];

  const dataBrasil = [
    { country: "Brasil", product: "Arroz", score: 23 },
    { country: "Brasil", product: "Azucar", score: 25 },
    { country: "Brasil", product: "Café molido", score: 24 },
    { country: "Brasil", product: "Frijoles", score: 25 },
    { country: "Brasil", product: "Cerveza", score: 25 },
    { country: "Brasil", product: "Pasta seca", score: 24 },
    { country: "Brasil", product: "Leche liquida", score: 25 },
    { country: "Brasil", product: "Refrescos de cola", score: 22 },
    { country: "Brasil", product: "Pan de molde", score: 25 },
    { country: "Brasil", product: "Pollo entero", score: 23 },
  ];

  const dataChile = [
    { country: "Chile", product: "Arroz", score: 5 },
    { country: "Chile", product: "Café molido", score: 24 },
    { country: "Chile", product: "Cerveza", score: 5 },
    { country: "Chile", product: "Huevos", score: 23 },
    { country: "Chile", product: "Leche liquida", score: 24 },
    { country: "Chile", product: "Manzanas", score: 4 },
    { country: "Chile", product: "Pan de molde", score: 25 },
    { country: "Chile", product: "Papas", score: 11 },
    { country: "Chile", product: "Pasta seca", score: 25 },
    { country: "Chile", product: "Pollo entero", score: 14 },
    { country: "Chile", product: "Refrescos de cola", score: 25 },
    { country: "Chile", product: "Tomates", score: 10 },
  ];

  const dataColombia = [
    { country: "Colombia", product: "Arroz", score: 27 },
    { country: "Colombia", product: "Azucar", score: 23 },
    { country: "Colombia", product: "Banano", score: 9 },
    { country: "Colombia", product: "Cebolla", score: 12 },
    { country: "Colombia", product: "Huevos", score: 22 },
    { country: "Colombia", product: "Leche liquida", score: 19 },
    { country: "Colombia", product: "Pan de molde", score: 27 },
    { country: "Colombia", product: "Papas", score: 15 },
    { country: "Colombia", product: "Queso blando", score: 25 },
    { country: "Colombia", product: "Tomates", score: 15 },
  ];

  const dataCostaRica = [
    { country: "Costa Rica", product: "Arroz", score: 26 },
    { country: "Costa Rica", product: "Azucar", score: 20 },
    { country: "Costa Rica", product: "Café molido", score: 32 },
    { country: "Costa Rica", product: "Frijoles", score: 27 },
    { country: "Costa Rica", product: "Huevos", score: 13 },
    { country: "Costa Rica", product: "Leche liquida", score: 19 },
    { country: "Costa Rica", product: "Pan de molde", score: 24 },
    { country: "Costa Rica", product: "Papas", score: 16 },
    { country: "Costa Rica", product: "Pasta seco", score: 25 },
    { country: "Costa Rica", product: "Refrescos de cola", score: 18 },
  ];

  const dataEcuador = [
    { country: "Ecuador", product: "Arroz", score: 19 },
    { country: "Ecuador", product: "Azucar", score: 15 },
    { country: "Ecuador", product: "Banano", score: 2 },
    { country: "Ecuador", product: "Cerveza", score: 24 },
    { country: "Ecuador", product: "Leche liquida", score: 24 },
    { country: "Ecuador", product: "Pan de molde", score: 23 },
    { country: "Ecuador", product: "Papas", score: 2 },
    { country: "Ecuador", product: "Pasta seca", score: 23 },
    { country: "Ecuador", product: "Queso blando", score: 17 },
    { country: "Ecuador", product: "Refrescos de cola", score: 24 },
  ];

  const dataMexico = [
    { country: "Mexico", product: "Aceite vegetal", score: 24 },
    { country: "Mexico", product: "Arroz", score: 23 },
    { country: "Mexico", product: "Azucar", score: 13 },
    { country: "Mexico", product: "Café molido", score: 25 },
    { country: "Mexico", product: "Cebolla", score: 5 },
    { country: "Mexico", product: "Harina de trigo", score: 22 },
    { country: "Mexico", product: "Huevos", score: 23 },
    { country: "Mexico", product: "Leche liquida", score: 25 },
    { country: "Mexico", product: "Pan de molde", score: 14 },
    { country: "Mexico", product: "Papas", score: 5 },
  ];

  const dataPanama = [
    { country: "Panama", product: "Aceite vegetal", score: 23 },
    { country: "Panama", product: "Arroz", score: 23 },
    { country: "Panama", product: "Atun en lata", score: 23 },
    { country: "Panama", product: "Azucar", score: 17 },
    { country: "Panama", product: "Banano", score: 5 },
    { country: "Panama", product: "Cebolla", score: 5 },
    { country: "Panama", product: "Frijoles", score: 20 },
    { country: "Panama", product: "Huevos", score: 22 },
    { country: "Panama", product: "Pan de molde", score: 17 },
    { country: "Panama", product: "Pollo entero", score: 13 },
  ];

  const dataParaguay = [
    { country: "Paraguay", product: "Aceite vegetal", score: 32 },
    { country: "Paraguay", product: "Arroz", score: 25 },
    { country: "Paraguay", product: "Cafe molido", score: 32 },
    { country: "Paraguay", product: "Harina de trigo", score: 25 },
    { country: "Paraguay", product: "Leche liquida", score: 24 },
    { country: "Paraguay", product: "Manzanas", score: 9 },
    { country: "Paraguay", product: "Pan de molde", score: 24 },
    { country: "Paraguay", product: "Papas", score: 20 },
    { country: "Paraguay", product: "Pasta seca", score: 27 },
    { country: "Paraguay", product: "Pollo entero", score: 12 },
  ];

  const dataPeru = [
    { country: "Peru", product: "Aceite vegetal", score: 25 },
    { country: "Peru", product: "Arroz", score: 25 },
    { country: "Peru", product: "Atun en lata", score: 23 },
    { country: "Peru", product: "Azucar", score: 25 },
    { country: "Peru", product: "Café molido", score: 25 },
    { country: "Peru", product: "Huevos", score: 19 },
    { country: "Peru", product: "Leche liquida", score: 25 },
    { country: "Peru", product: "Pan de molde", score: 25 },
    { country: "Peru", product: "Pasta seca", score: 25 },
    { country: "Peru", product: "Pollo entero", score: 21 },
  ];


  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const totalProductQueries = productData.reduce((sum, p) => sum + p.queries, 0);

  const handleDashboardQuery = async () => {
    if (!queryText.trim()) return;

    setIsQuerying(true);
    setQueryResults([]);
    setQueryChart(null);

    try {
      // Try streaming first
      const stream = await sendDashboardQueryStream({
        query: queryText,
        top_k: 10,
        threshold: queryThreshold[0]
      });

      let buffer = '';
      let accumulatedResults: any[] = [];

      for await (const chunk of stream) {
        buffer += chunk;

        // Parse streaming data
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line.replace(/^data: /, ''));

              if (data.results) {
                accumulatedResults = [...accumulatedResults, ...data.results];
                setQueryResults(accumulatedResults);
              }
              if (data.chart) {
                setQueryChart(data.chart);
              }
            } catch (e) {
              console.log('Parsing chunk:', line);
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming failed, trying regular query:', error);

      try {
        // Fallback to regular query
        const response = await sendDashboardQuery({
          query: queryText,
          top_k: 10,
          threshold: queryThreshold[0]
        });

        setQueryResults(response.results || []);
        setQueryChart(response.chart || null);

      } catch (fallbackError) {
        console.error('Both streaming and regular query failed:', fallbackError);

        toast({
          title: "Error en la consulta",
          description: "No se pudo conectar con el servidor para realizar la consulta.",
          variant: "destructive"
        });
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <img className='h-10 w-10' src={logoImage} alt="Logo" />
                <span className="text-lg font-semibold">Dashboard General</span>
                <span className="text-lg font-semibold">- SPI</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/chatbot">
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chatbot
                </Button>
              </Link>

              {/* Dashboard Query Section */}
              <div className="flex items-center space-x-2 ml-4">
                <Input
                  placeholder="Consultar datos..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="w-64"
                  onKeyPress={(e) => e.key === 'Enter' && handleDashboardQuery()}
                />
                <Button
                  onClick={handleDashboardQuery}
                  disabled={!queryText.trim() || isQuerying}
                  variant="default"
                >
                  {isQuerying ? 'Consultando...' : 'Consultar'}
                </Button>
              </div>
              <UserAvatarLink />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Período:</label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">País:</label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los países</SelectItem>
                <SelectItem value="es">España</SelectItem>
                <SelectItem value="mx">México</SelectItem>
                <SelectItem value="ar">Argentina</SelectItem>
                <SelectItem value="co">Colombia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Umbral:</label>
            <div className="w-32">
              <Slider
                value={queryThreshold}
                onValueChange={setQueryThreshold}
                max={1}
                min={0.1}
                step={0.05}
                className="w-full"
              />
            </div>
            <span className="text-xs text-muted-foreground w-12">
              {(queryThreshold[0] * 100).toFixed(0)}%
            </span>
          </div>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div> */}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-card border-0 shadow-elevation">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Consultas SPI</CardTitle>
              <MessageSquare className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.totalQueries.toLocaleString()}</div>
              <Badge variant="outline" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%
              </Badge>
            </CardContent>
          </Card>


          <Card className="bg-gradient-card border-0 shadow-elevation">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Numero de Consultas</CardTitle>
              <Clock className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.p95Latency}ms</div>
              <Badge variant="outline" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                -8.7%
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-0 shadow-elevation">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CTR Preguntas Respondidas</CardTitle>
              <Target className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpiData.evidenceClickthrough}%</div>
              <Badge variant="outline" className="mt-2">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3.2%
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Query Results Section */}
        {(queryResults.length > 0 || queryChart) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resultados de Consulta</CardTitle>
              <CardDescription>
                Resultados para: "{queryText}" (Umbral: {(queryThreshold[0] * 100).toFixed(0)}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queryResults.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">{queryResults.length}</div>
                        <div className="text-sm text-muted-foreground">Resultados</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                          {queryResults.length > 0 ? (queryResults.reduce((sum, r) => sum + r.score, 0) / queryResults.length * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-muted-foreground">Score Promedio</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border p-2 text-left">Producto</th>
                          <th className="border border-border p-2 text-left">Precio</th>
                          <th className="border border-border p-2 text-left">País</th>
                          <th className="border border-border p-2 text-left">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {queryResults.map((result, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="border border-border p-2">{result.product}</td>
                            <td className="border border-border p-2">${result.precio?.toFixed(2) || 'N/A'}</td>
                            <td className="border border-border p-2">{result.country}</td>
                            <td className="border border-border p-2">
                              <Badge variant={result.score >= 0.8 ? "default" : "secondary"}>
                                {(result.score * 100).toFixed(1)}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {queryChart && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold mb-2">Gráfico de Resultados</h4>
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">
                      Gráfico disponible (implementar según formato de tu API)
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts Section */}
        <Tabs defaultValue="timeseries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeseries">Series Temporales</TabsTrigger>
            <TabsTrigger value="intents">Intenciones</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="timeseries" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" />
                    Sus Consultas por Hora
                  </CardTitle>
                  <CardDescription>Volumen de consultas a lo largo del día</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={timeseriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="queries"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-secondary" />
                    Sus ultimas consultas
                  </CardTitle>
                  <CardDescription>Aca estan las 5 ultimas consultas que ha realizado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: 'black' }}
                          ></div>
                          <span className="font-medium">Consulta 1</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: 'black' }}
                          ></div>
                          <span className="font-medium">Consulta 2</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: 'black' }}
                          ></div>
                          <span className="font-medium">Consulta 3</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: 'black' }}
                          ></div>
                          <span className="font-medium">Consulta 4</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: 'black' }}
                          ></div>
                          <span className="font-medium">Consulta 5</span>
                        </div>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="intents" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-accent" />
                    Distribución de Intenciones
                  </CardTitle>
                  <CardDescription>Tipos de consultas más frecuentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={intentData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ intent, percentage }: any) => `${intent}: ${percentage}%`}
                      >
                        {intentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Intenciones</CardTitle>
                  <CardDescription>Ranking de consultas por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {intentData.map((intent, index) => (
                      <div key={intent.intent} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index] }}
                          ></div>
                          <span className="font-medium">{intent.intent}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{intent.count.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{intent.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Products list */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Productos con los que trabajamos</CardTitle>
                  <CardDescription>
                    Productos más presentes para el reporte y su relevancia. TOTAL: <b>2031</b> productos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productData.map((product, index) => (
                      <div key={product.product} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <span className="font-medium">{product.product}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-semibold">{product.queries.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">datos en SPI</div>
                          </div>
                          <Badge variant={product.relevance >= 90 ? "default" : "secondary"}>
                            {product.relevance}% del total
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right: Horizontal bar chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-accent" />
                    Participación por Producto
                  </CardTitle>
                  <CardDescription>Número de datos registrados por producto</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={360}>
                    <RechartsBarChart
                      data={productData.slice(0, 12).reverse()}
                      layout="vertical"
                      margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="2 2" />
                      <XAxis type="number" tickFormatter={(v) => Number(v).toLocaleString()} />
                      <YAxis type="category" dataKey="product" width={160} interval={0} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [`${Number(value).toLocaleString()} datos`, 'Consultas']}
                      />
                      <Bar dataKey="queries" radius={[3, 3, 3, 3]}>
                        {productData.slice(0, 12).reverse().map((_, index) => (
                          <Cell key={`prod-bar-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>

                  {/* Country-specific product charts in an accordion under the chart */}
                  <div className="mt-4">
                    <Accordion type="single" collapsible className="w-full">
                      {[
                        { name: 'Argentina', data: dataArgentina },
                        { name: 'Brasil', data: dataBrasil },
                        { name: 'Chile', data: dataChile },
                        { name: 'Colombia', data: dataColombia },
                        { name: 'Costa Rica', data: dataCostaRica },
                        { name: 'Ecuador', data: dataEcuador },
                        { name: 'Mexico', data: dataMexico },
                        { name: 'Panama', data: dataPanama },
                        { name: 'Paraguay', data: dataParaguay },
                        { name: 'Peru', data: dataPeru },
                      ].map((ds, idx) => {
                        const sorted = [...ds.data].sort((a, b) => a.score - b.score);
                        const chartData = sorted.slice().reverse();
                        const height = Math.min(420, Math.max(220, chartData.length * 24));
                        const barColor = COLORS[idx % COLORS.length];
                        return (
                          <AccordionItem key={`acc-${ds.name}`} value={ds.name}>
                            <AccordionTrigger className="text-sm">{`Productos en ${ds.name}`}</AccordionTrigger>
                            <AccordionContent>
                              <ResponsiveContainer width="100%" height={height}>
                                <RechartsBarChart
                                  data={chartData}
                                  layout="vertical"
                                  margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
                                >
                                  <CartesianGrid strokeDasharray="2 2" />
                                  <XAxis type="number" />
                                  <YAxis type="category" dataKey="product" width={180} interval={0} tick={{ fontSize: 12 }} />
                                  <Tooltip formatter={(value: number) => [`${Number(value).toLocaleString()} datos`, 'Score']} />
                                  <Bar dataKey="score" radius={[2, 2, 2, 2]}>
                                    {chartData.map((_, i) => (
                                      <Cell key={`cell-${ds.name}-${i}`} fill={barColor} />
                                    ))}
                                  </Bar>
                                </RechartsBarChart>
                              </ResponsiveContainer>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
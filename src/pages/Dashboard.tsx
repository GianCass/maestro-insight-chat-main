import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Link } from "react-router-dom";
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

const Dashboard = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCountry, setSelectedCountry] = useState('all');

  useEffect(() => {
    document.title = "Dashboard General - SPI";
  }, []);

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
    { product: 'Smartphones', queries: 2500, relevance: 92 },
    { product: 'Laptops', queries: 1800, relevance: 88 },
    { product: 'Tablets', queries: 1200, relevance: 85 },
    { product: 'Auriculares', queries: 900, relevance: 90 },
    { product: 'Smartwatches', queries: 700, relevance: 87 }
  ];

  const sessionsData = [
    { id: '1', timestamp: '2024-01-15 14:30', intent: 'Consulta Precios', country: 'España', confidence: 0.92 },
    { id: '2', timestamp: '2024-01-15 14:28', intent: 'Análisis Mercado', country: 'México', confidence: 0.87 },
    { id: '3', timestamp: '2024-01-15 14:25', intent: 'Comparar Productos', country: 'Argentina', confidence: 0.95 },
    { id: '4', timestamp: '2024-01-15 14:22', intent: 'Tendencias', country: 'Colombia', confidence: 0.78 },
    { id: '5', timestamp: '2024-01-15 14:20', intent: 'Consulta Precios', country: 'España', confidence: 0.89 }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

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
                <Brain className="h-6 w-6 text-primary" />
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
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-5 w-5" />
              </Button>
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
            <Card>
              <CardHeader>
                <CardTitle>Top Productos Consultados</CardTitle>
                <CardDescription>Productos más buscados y su relevancia</CardDescription>
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
                          <div className="text-xs text-muted-foreground">consultas</div>
                        </div>
                        <Badge variant={product.relevance >= 90 ? "default" : "secondary"}>
                          {product.relevance}% relevancia
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
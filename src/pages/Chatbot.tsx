import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { generatePlot } from "@/api/plotlyService";
import { PlotlyChart } from "@/components/PlotlyChart";
import {
  Send,
  Bot,
  User,
  Settings,
  MessageSquare,
  Home,
  Plus,
  MoreVertical,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { ChatMessage, Evidence } from "@/types";
import { sendChat, generateSessionId, chatHistory } from "@/api/chat";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Chatbot = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Session management
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('pricing-session');
    if (stored) return stored;
    const newId = generateSessionId();
    localStorage.setItem('pricing-session', newId);
    return newId;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = chatHistory.load(sessionId);
    if (stored.length > 0) return stored;

    return [{
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de análisis de retail. Puedo ayudarte con datos de precios, tendencias del mercado y análisis de productos. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toISOString(),
      confidence: 0.95
    }];
  });

  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false); // mantenido para la UI
  const [strictMode, setStrictMode] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.7]);
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [retryRequest, setRetryRequest] = useState<{ message: string } | null>(null);

  const [figure, setFigure] = useState<any>(null);
  const [figureQuery, setFigureQuery] = useState('');
  const [isPlotLoading, setIsPlotLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (messageToSend?: string) => {
    const messageText = messageToSend || currentMessage.trim();
    if (!messageText) return;

    // ⚠️ Si quieres permitir chat anónimo, comenta este bloque:
    if (!user) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para usar el chatbot.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => {
      const updated = [...prev, userMessage];
      chatHistory.save(sessionId, updated);
      return updated;
    });

    if (!messageToSend) setCurrentMessage('');
    setIsLoading(true);
    setIsStreaming(false); // no usamos streaming real
    setRetryRequest(null);

    // Mensaje temporal del asistente
    const tempAssistantId = (Date.now() + 1).toString();
    const tempAssistantMessage: ChatMessage = {
      id: tempAssistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => {
      const updated = [...prev, tempAssistantMessage];
      return updated;
    });

    try {
      // ✅ Llamada no-stream normalizada
      const response = await sendChat({
        message: messageText,
        sessionId,
        strict: strictMode,
        threshold: confidenceThreshold[0]
      });

      // const finalMessage: ChatMessage = {
      //   id: tempAssistantId,
      //   role: 'assistant',
      //   content: response.message || 'No se recibió respuesta',
      //   timestamp: new Date().toISOString(),
      //   confidence: response.confidence,
      //   evidences: (response.sources || []).map((source: any) => ({
      //     id: source.id || Math.random().toString(),
      //     title: source.title || 'Fuente',
      //     score: source.score || 0,
      //     url: source.url,
      //     snippet: source.snippet,
      //     source: source.source || 'API'
      //   }))
      // };

      const finalMessage: ChatMessage = {
      id: tempAssistantId,
      role: 'assistant',
      content: response.message || 'No se recibió respuesta',
      timestamp: new Date().toISOString(),
      confidence: response.confidence,
      evidences: (response.sources || []).map((source: any) => ({
        id: source.id || Math.random().toString(),
        title: source.title || 'Fuente',
        score: source.score || 0,
        url: source.url,
        snippet: source.snippet,
        source: source.source || 'API'
      })),
      type: response.type || 'text',
      sources: response.sources || [],
      result: response.result || undefined
    };

      setMessages(prev => {
        const updated = prev.map(msg => msg.id === tempAssistantId ? finalMessage : msg);
        chatHistory.save(sessionId, updated);
        return updated;
      });

    } catch (error) {
      console.error('Chat request failed:', error);

      // Quita el mensaje temporal y ofrece reintento
      setMessages(prev => prev.filter(msg => msg.id !== tempAssistantId));
      setRetryRequest({ message: messageText });

      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor. Verifica que el backend esté en http://127.0.0.1:8000 y tu .env del front tenga VITE_PUBLIC_API_BASE.",
        variant: "destructive",
        action: (
          <Button variant="outline" size="sm" onClick={() => handleSendMessage(messageText)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    const newSessionId = generateSessionId();
    localStorage.setItem('pricing-session', newSessionId);

    const initialMessage: ChatMessage = {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de análisis de retail. Puedo ayudarte con datos de precios, tendencias del mercado y análisis de productos. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toISOString(),
      confidence: 0.95
    };

    setMessages([initialMessage]);
    chatHistory.clear(sessionId);
    window.location.reload(); // Reload to reset session
  };

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save just the initial message
      chatHistory.save(sessionId, messages);
    }
  }, [messages, sessionId]);

  const EvidenceChips = ({ evidences }: { evidences: Evidence[] }) => (
    <Accordion type="single" collapsible className="mt-3">
      <AccordionItem value="sources" className="border-none">
        <AccordionTrigger className="text-sm py-2 hover:no-underline">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Fuentes ({evidences.length})
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-wrap gap-2">
            {evidences.map(evidence => (
              <Badge
                key={evidence.id}
                variant="outline"
                className="flex items-center gap-1 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => evidence.url && window.open(evidence.url, '_blank')}
              >
                <span className="text-xs">
                  {evidence.title} ({(evidence.score * 100).toFixed(0)}%)
                </span>
                <ExternalLink className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const handleGeneratePlot = async () => {
  if (!figureQuery.trim()) return;
  setIsPlotLoading(true);
  setFigure(null);

  try {
    const res = await generatePlot(figureQuery);
    setFigure(res);
  } catch (err) {
    console.error("Error generando gráfica:", err);
    toast({
      title: "Error al generar visualización",
      description: "No se pudo obtener la gráfica desde el servidor.",
      variant: "destructive"
    });
  } finally {
    setIsPlotLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Chatbot IA</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card/30 p-4">
          <div className="space-y-4">
            {/* New Chat Button */}
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleNewConversation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Conversación
            </Button>

            {/* Chat Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="gpt-4">GPT-4 (Recomendado)</option>
                    <option value="gpt-3.5">GPT-3.5 Turbo</option>
                    <option value="claude">Claude-3</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Modo Estricto</label>
                  <Switch
                    checked={strictMode}
                    onCheckedChange={setStrictMode}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Umbral de Confianza: {(confidenceThreshold[0] * 100).toFixed(0)}%
                  </label>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={1}
                    min={0.1}
                    step={0.05}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chat History */}
            <div>
              <h3 className="text-sm font-medium mb-3">Historial Reciente</h3>
              <div className="space-y-2">
                {[
                  'Análisis de precios Q4',
                  'Tendencias retail Europa',
                  'Comparativa productos tech'
                ].map((title, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md hover:bg-accent cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{title}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`max-w-2xl ${message.role === 'user' ? 'order-2' : ''}`}>
                    <Card className={`${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                      <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none">
                          {message.content.split('\n').map((line, index) => {
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return <h4 key={index} className="font-semibold my-2">{line.slice(2, -2)}</h4>;
                            }
                            return <p key={index} className="mb-2">{line}</p>;
                          })}
                        </div>

                        {message.role === 'assistant' && (
                          <>
                            {message.confidence && (
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  Confianza: {(message.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            )}

                            {message.evidences && message.evidences.length > 0 && (
                              <EvidenceChips evidences={message.evidences} />
                            )}


                            {message.type === "table" && Array.isArray(message.items) && message.items.length > 0 && (
                                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                  <table className="min-w-full text-sm text-left border-collapse">
                                    <thead className="bg-gray-100 text-gray-700">
                                      <tr>
                                        <th className="px-4 py-2">Producto</th>
                                        <th className="px-4 py-2">Marca</th>
                                        <th className="px-4 py-2">Tienda</th>
                                        <th className="px-4 py-2 text-right">Precio</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {message.items?.map((item, idx) => (
                                        <tr key={idx} className="border-t">
                                          <td className="px-4 py-2">
                                            <a
                                              href={item.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-600 hover:underline"
                                            >
                                              {item.name}
                                            </a>
                                          </td>
                                          <td className="px-4 py-2">{item.brand}</td>
                                          <td className="px-4 py-2">{item.store}</td>
                                          <td className="px-4 py-2 text-right font-semibold">
                                            {item.price?.toLocaleString("es-CO")} {item.currency}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}


                              {Array.isArray(message.sources) && message.sources.length > 0 && (
                                <div className="mt-3 text-xs text-gray-600">
                                  <p className="font-semibold mb-1">📚 Fuentes:</p>
                                  <ul className="list-disc pl-5">
                                    {message.sources?.map((src, i) => (
                                      <li key={i}>
                                        {src.url ? (
                                          <a
                                            href={src.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            {src.title}
                                          </a>
                                        ) : (
                                          <span>{src.title}</span>
                                        )}
                                        {src.score && (
                                          <span className="ml-2 text-gray-400">
                                            ({(src.score * 100).toFixed(0)}% confianza)
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* Model and planner info */}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>modelo: {selectedModel}</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 order-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white animate-pulse" />
                    </div>
                  </div>
                  <Card className="bg-card max-w-2xl">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {isStreaming ? 'escribiendo...' : 'conectando...'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {retryRequest && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  </div>
                  <Card className="bg-card max-w-2xl border-destructive/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Error al enviar mensaje</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendMessage(retryRequest.message)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reintentar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
              {/* Área de visualizaciones */}
              <div className="border-t border-border bg-muted/30 p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Generar visualización dinámica
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      value={figureQuery}
                      onChange={(e) => setFigureQuery(e.target.value)}
                      placeholder="Ejemplo: Mostrar la evolución de precios de los productos tecnológicos en Q2"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleGeneratePlot}
                      disabled={isPlotLoading || !figureQuery.trim()}
                      variant="outline"
                    >
                      {isPlotLoading ? "Generando..." : "Visualizar"}
                    </Button>
                  </div>

                  {figure && <PlotlyChart figure={figure} />}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregunta sobre datos de retail, precios o tendencias..."
                    className="min-h-12 resize-none"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!currentMessage.trim() || isLoading}
                  variant="analytics"
                  size="icon"
                  className="h-12 w-12"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Presiona Shift+Enter para nueva línea</span>
                <span>Modo: {strictMode ? 'Solo DB' : 'IA Completa'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

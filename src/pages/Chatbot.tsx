import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link, useNavigate } from "react-router-dom";
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
  AlertCircle,
  Brain,
} from "lucide-react";
import UserAvatarLink from "@/components/UserAvatarLink";

import type {
  ChatMessage,
  Evidence,
  ProductRow,
  AggregateResult,
} from "@/types";
import {
  sendChatStream,
  generateSessionId,
  chatHistory,
  type ChatIntentType,
  type RawSource,
} from "@/api/chat";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/image/logo1.png";
import { supabase } from "@/integrations/supabase/client";

/* ======================= Tipos UI ======================= */

// Fuente tal como la espera la UI (id y title obligatorios)
type UISource = {
  id: string;
  title: string;
  score?: number;
  url?: string;
  snippet?: string;
  source?: string;
};

// Mensaje enriquecido para el front
// Omitimos 'sources', 'items' y 'result' del ChatMessage base para tiparlos a la medida de la UI
type UIMessage = Omit<ChatMessage, "sources" | "items" | "result"> & {
  sources?: UISource[];
  type?: ChatIntentType;
  items?: ProductRow[];
  result?: AggregateResult;
  evidences?: Evidence[];
};

type PlotFigure = unknown;

/* ======================= Normalizadores ======================= */

// Convierte RawSource[]/variantes a UISource[] (sin usar 'any')
const normalizeSources = (
  arr?:
    | RawSource[]
    | Array<{
        id?: string;
        title?: string;
        name?: string;
        score?: number;
        url?: string;
        snippet?: string;
        source?: string;
      }>
): UISource[] | undefined => {
  if (!arr) return undefined;
  return arr.map((s) => {
    const titleFromName =
      "name" in s && typeof s.name === "string" ? s.name : undefined;
    return {
      id: s.id ?? Math.random().toString(),
      title: s.title ?? titleFromName ?? "Fuente",
      score: s.score,
      url: s.url,
      snippet: s.snippet,
      source: s.source,
    };
  });
};

// Convierte items sueltos del stream a ProductRow[]
const toProductRows = (arr?: unknown): ProductRow[] | undefined => {
  if (!Array.isArray(arr)) return undefined;
  return arr.map((it) => {
    const r = it as Record<string, unknown>;
    const priceRaw = r.price;
    const price =
      typeof priceRaw === "number"
        ? priceRaw
        : priceRaw != null
        ? Number(priceRaw)
        : undefined;

    return {
      name: String(r.name ?? r.title ?? "Producto"),
      brand: String(r.brand ?? ""),
      store: String(r.store ?? ""),
      price,
      currency: String(r.currency ?? ""),
      url: typeof r.url === "string" ? r.url : undefined,
    } as ProductRow;
  });
};

// Valida que un valor sea AggregateResult (evita error "groups is missing")
const toAggregateResult = (
  val: unknown
): AggregateResult | undefined => {
  if (!val || typeof val !== "object") return undefined;
  const obj = val as { groups?: unknown };
  if (!Array.isArray(obj.groups)) return undefined;
  // Si tu AggregateResult exige otras props, añádelas aquí como guards.
  return val as AggregateResult;
};

/* ======================= Componente ======================= */

const Chatbot = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Session management
  const [sessionId, setSessionId] = useState(() => {
    const stored = localStorage.getItem("pricing-session");
    if (stored) return stored;
    const newId = generateSessionId();
    localStorage.setItem("pricing-session", newId);
    return newId;
  });

  const [messages, setMessages] = useState<UIMessage[]>([]);

  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number[]>([
    0.7,
  ]);
  const [selectedModel, setSelectedModel] = useState("llama3:8b");
  const [retryRequest, setRetryRequest] = useState<{ message: string } | null>(
    null
  );

  const [figure, setFigure] = useState<PlotFigure>(null);
  const [figureQuery, setFigureQuery] = useState("");
  const [isPlotLoading, setIsPlotLoading] = useState(false);
  // Emoji del usuario autenticado para el avatar de mensajes del lado derecho
  const [userEmoji, setUserEmoji] = useState<string>("🧑");
  // Chats del usuario
  type ChatRow = { id: string; title: string; created_at: string };
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  // ID del chat en Supabase para esta sesión (se define al primer mensaje)
  const [chatDbId, setChatDbId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`chatdb-${sessionId}`);
    } catch {
      return null;
    }
  });
  const isCreatingChatRef = useRef(false);

  // UI state for chat context actions
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameChatId, setRenameChatId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auth guard: redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  // Cargar lista de chats del usuario
  useEffect(() => {
    const loadChats = async () => {
      if (!user?.id) return;
      setLoadingChats(true);
      try {
        const { data, error } = await (supabase as any)
          .from("chats")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) {
          setChats(data as ChatRow[]);
        }
      } catch (e) {
        console.warn("No se pudieron cargar los chats:", e);
      } finally {
        setLoadingChats(false);
      }
    };
    loadChats();
  }, [user?.id]);

  // Cargar emoji del usuario autenticado para usarlo como avatar en mensajes del usuario
  useEffect(() => {
    const loadEmoji = async () => {
      if (!user?.id) {
        setUserEmoji("🧑");
        return;
      }
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("profile_emoji")
          .eq("id", user.id)
          .single();
        if (!error && data?.profile_emoji) {
          setUserEmoji(String(data.profile_emoji));
        } else {
          setUserEmoji("🧑");
        }
      } catch {
        setUserEmoji("🧑");
      }
    };
    loadEmoji();
  }, [user?.id]);

  // Restaurar último chat seleccionado tras recarga o navegación desde Settings
  useEffect(() => {
    if (!user?.id) return;
    if (selectedChatId) return; // ya hay uno seleccionado
    if (messages.length > 0) return; // si ya hay mensajes (p.ej., nueva conversación), no restaurar
    try {
      // Priorizar 'last-chat-id' (acción explícita del usuario desde Settings) sobre el mapeo de sesión
      const saved = localStorage.getItem('last-chat-id') || localStorage.getItem(`chatdb-${sessionId}`);
      if (saved) {
        // Abrir automáticamente el último chat
        void openChat(saved);
      }
    } catch { /* noop */ }
  }, [user?.id, sessionId, selectedChatId, messages.length]);

  // Seleccionar un chat: cargar historial de mensajes y fijar mapping de chat_id
  const openChat = async (chatId: string) => {
    setSelectedChatId(chatId);
    try { localStorage.setItem('last-chat-id', chatId); } catch {}
    try {
      // Persist mapping a esta sesión
      setChatDbId(chatId);
      try { localStorage.setItem(`chatdb-${sessionId}`, chatId); } catch {}

      const { data, error } = await (supabase as any)
        .from("messages")
        .select("id, prompt, respuesta, created_at")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const history: UIMessage[] = [];
      // Reconstruimos como pares user -> assistant
      (data || []).forEach((m: any) => {
        if (m.prompt) {
          history.push({
            id: `${m.id}-u`,
            role: "user",
            content: String(m.prompt),
            timestamp: m.created_at ?? new Date().toISOString(),
          });
        }
        history.push({
          id: `${m.id}-a`,
          role: "assistant",
          content: String(m.respuesta ?? ""),
          timestamp: m.created_at ?? new Date().toISOString(),
        });
      });

      // Si no hay mensajes, mostrar el saludo inicial
      const initialIfEmpty: UIMessage[] = history.length > 0 ? history : [
        {
          id: "1",
          role: "assistant",
          content:
            "¡Hola! Soy Pricy, tu asistente de análisis de retail. Puedo ayudarte con datos de precios, tendencias del mercado y análisis de productos. ¿En qué puedo ayudarte hoy?",
          timestamp: new Date().toISOString(),
          confidence: 0.95,
        },
      ];

      setMessages(initialIfEmpty);
      chatHistory.save(sessionId, initialIfEmpty);
    } catch (e) {
      console.error("No se pudo abrir el chat:", e);
      toast({ title: "No se pudo cargar el chat", variant: "destructive" });
    }
  };

  // === Chat actions: rename & delete ===
  const openRenameDialog = (chatId: string, currentTitle: string) => {
    setRenameChatId(chatId);
    setRenameTitle(currentTitle || "");
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    const title = renameTitle.trim();
    if (!renameChatId || title.length === 0) {
      toast({ title: "Título inválido", description: "Escribe un nombre para el chat.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await (supabase as any)
        .from("chats")
        .update({ title })
        .eq("id", renameChatId);
      if (error) throw error;

      setChats((prev) => prev.map((c) => (c.id === renameChatId ? { ...c, title } : c)));
      setRenameDialogOpen(false);
      setRenameChatId(null);
      toast({ title: "Chat renombrado" });
    } catch (e) {
      console.error("No se pudo renombrar el chat:", e);
      toast({ title: "No se pudo renombrar", variant: "destructive" });
    }
  };

  const openDeleteConfirm = (chatId: string) => {
    setDeleteChatId(chatId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteChatId) return;
    const chatId = deleteChatId;
    try {
      // Primero borrar mensajes; luego el chat
      await (supabase as any).from("messages").delete().eq("chat_id", chatId);
      const { error } = await (supabase as any).from("chats").delete().eq("id", chatId);
      if (error) throw error;

      // Actualizar estado local y storage
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
        chatHistory.clear(sessionId);
        setFigure(null);
        setFigureQuery("");
        setIsPlotLoading(false);
      }
      try {
        const mapped = localStorage.getItem(`chatdb-${sessionId}`);
        if (mapped === chatId) {
          localStorage.removeItem(`chatdb-${sessionId}`);
          setChatDbId(null);
        }
        const last = localStorage.getItem('last-chat-id');
        if (last === chatId) {
          localStorage.removeItem('last-chat-id');
        }
        localStorage.removeItem(`vizprompt-${chatId}`);
      } catch { /* noop */ }

      toast({ title: "Chat eliminado" });
    } catch (e) {
      console.error("No se pudo eliminar el chat:", e);
      toast({ title: "No se pudo eliminar", variant: "destructive" });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteChatId(null);
    }
  };

  const handleSendMessage = async (messageToSend?: string) => {
    const messageText = messageToSend || currentMessage.trim();
    if (!messageText) return;

    if (!user) {
      toast({
        title: "Autenticación requerida",
        description: "Debes iniciar sesión para usar el chatbot.",
        variant: "destructive",
      });
      return;
    }

    // Crear registro del chat en Supabase al primer mensaje si aún no existe
    try {
      const existingId = chatDbId ?? localStorage.getItem(`chatdb-${sessionId}`);
      if (!existingId) {
        // Usar el primer prompt completo del usuario como título del chat
        const title = messageText.trim() || "Conversación";
        const { data, error } = await (supabase as any)
          .from("chats")
          .insert({ title, user_id: user.id })
          .select("id")
          .single();
        if (!error && data?.id) {
          const newId = String(data.id);
          setChatDbId(newId);
          setSelectedChatId(newId);
          try {
            localStorage.setItem(`chatdb-${sessionId}`, newId);
            localStorage.setItem('last-chat-id', newId);
          } catch {}
          // Refrescar la lista en memoria sin recargar
          setChats((prev) => [{ id: newId, title, created_at: new Date().toISOString() }, ...prev]);
        }
      }
    } catch (e) {
      console.warn("No se pudo crear el chat en Supabase:", e);
    }

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      chatHistory.save(sessionId, updated);
      return updated;
    });

    if (!messageToSend) setCurrentMessage("");
    setIsLoading(true);
    setIsStreaming(true);
    setRetryRequest(null);

    // Mensaje temporal del asistente (se irá llenando)
    const tempAssistantId = (Date.now() + 1).toString();
    const tempAssistantMessage: UIMessage = {
      id: tempAssistantId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempAssistantMessage]);

    try {
      const stream = await sendChatStream({
        message: messageText,
        sessionId,
        strict: strictMode,
        threshold: confidenceThreshold[0],
      });
      let finalAnswer = "";
      for await (const part of stream) {
      // ⬇️ Si el backend envía un prompt de visualización, disparamos Plotly
          if (part.vizPrompt) {
            setFigureQuery(part.vizPrompt);      // muestra el prompt en el input de la UI (opcional)
            setIsPlotLoading(true);
            // No bloqueamos el stream: disparamos en segundo plano
            generatePlot(part.vizPrompt)
              .then((fig) => setFigure(fig as PlotFigure))
              .catch((err) => {
                console.error("Error generando gráfica:", err);
                toast({
                  title: "No pude generar la visualización",
                  description: "Revisa el prompt o el servicio de gráficas.",
                  variant: "destructive",
                });
              })
              .finally(() => setIsPlotLoading(false));
          }

        if (typeof part.content === "string") {
          finalAnswer = part.content;
        }

        setMessages((prev) => {
          const next: UIMessage[] = prev.map((msg) => {
            if (msg.id !== tempAssistantId) return msg;

            const unifiedSources =
              normalizeSources(part.sources ?? msg.sources) ?? msg.sources;

            const updated: UIMessage = {
              ...msg,
              content: part.content ?? msg.content,
              confidence:
                part.confidence !== undefined ? part.confidence : msg.confidence,
              sources: unifiedSources,
              evidences: unifiedSources?.map((src) => ({
                id: src.id,
                title: src.title,
                score: src.score ?? 0,
                url: src.url,
                snippet: src.snippet,
                source: src.source ?? "API",
              })),
              type: part.type ?? msg.type,
              items: toProductRows(part.items) ?? msg.items,
              result: toAggregateResult(part.result) ?? msg.result,
            };

            return updated;
          });

          chatHistory.save(sessionId, next);
          return next;
        });
      }

      // Guardar el mensaje en Supabase una vez que termina el stream
      try {
        const chatId = chatDbId ?? localStorage.getItem(`chatdb-${sessionId}`);
        if (chatId) {
          await (supabase as any)
            .from("messages")
            .insert({
              prompt: messageText,
              respuesta: finalAnswer || "",
              intencion: "-",
              visualizacion: "-",
              chat_id: chatId,
            });
        } else {
          console.warn("No se encontró chat_id para guardar el mensaje");
        }
      } catch (e) {
        console.warn("No se pudo guardar el mensaje en Supabase:", e);
      }
    } catch (error) {
      console.error("Chat stream failed:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempAssistantId));
      setRetryRequest({ message: messageText });

      toast({
        title: "Error de conexión",
        description:
          "No se pudo conectar con el backend. Verifica la URL y las variables de entorno.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSendMessage(messageText)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        ),
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    const newSessionId = generateSessionId();
    // Persist new session id and reset mapping
    localStorage.setItem("pricing-session", newSessionId);
    try { localStorage.removeItem(`chatdb-${sessionId}`); } catch {}
    try { localStorage.removeItem('last-chat-id'); } catch {}

    // Update stateful session id to avoid reloading the page
    setSessionId(newSessionId);
    setSelectedChatId(null);
    setChatDbId(null);
    chatHistory.clear(sessionId);

  // Ocultar cualquier visualización dinámica previa
  setFigure(null);
  setFigureQuery("");
  setIsPlotLoading(false);

    const initialMessage: UIMessage = {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! Soy Pricy, tu asistente de análisis de retail. Puedo ayudarte con datos de precios, tendencias del mercado y análisis de productos. ¿En qué puedo ayudarte hoy?",
      timestamp: new Date().toISOString(),
      confidence: 0.95,
    };

    setMessages([initialMessage]);
  };

  useEffect(() => {
    document.title = "Chatbot - SPI";
    if (messages.length > 1) {
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
            {evidences.map((evidence) => (
              <Badge
                key={evidence.id}
                variant="outline"
                className="flex items-center gap-1 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => evidence.url && window.open(evidence.url, "_blank")}
              >
                <span className="text-xs">
                  {evidence.title} ({((evidence.score ?? 0) * 100).toFixed(0)}%)
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
      setFigure(res as PlotFigure);
    } catch (err) {
      console.error("Error generando gráfica:", err);
      toast({
        title: "Error al generar visualización",
        description: "No se pudo obtener la gráfica desde el servidor.",
        variant: "destructive",
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
              <img className='h-10 w-10' src={logoImage} alt="Logo" />
              <span className="text-lg font-semibold">Chatbot SPI</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
            <UserAvatarLink />
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-card/30 p-4">
          <div className="space-y-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleNewConversation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Conversación
            </Button>


            <div>
              <h3 className="text-sm font-medium mb-3">Tus Chats</h3>
              <div className="space-y-2">
                {loadingChats && (
                  <div className="text-xs text-muted-foreground">Cargando…</div>
                )}
                {!loadingChats && chats.length === 0 && (
                  <div className="text-xs text-muted-foreground">Aún no tienes chats.</div>
                )}
                {!loadingChats && chats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openChat(c.id)}
                    className={`w-full p-3 rounded-md group flex items-center justify-between text-left
                      ${selectedChatId === c.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-primary/20 dark:hover:bg-primary/30'}`}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageSquare className={`h-5 w-5 ${selectedChatId === c.id ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      <span className="text-sm break-words whitespace-normal">{c.title || 'Conversación'}</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          title={new Date(c.created_at).toLocaleString()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className={`h-3 w-3 ${selectedChatId === c.id ? 'text-primary-foreground' : ''}`} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openRenameDialog(c.id, c.title)}>
                          Renombrar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => openDeleteConfirm(c.id)}>
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages / Placeholder */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.length === 0 && !selectedChatId ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="mb-4">
                    <Bot className="h-10 w-10 text-primary mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Bienvenido al Chatbot, soy Pricy!</h3>
                  <p className="max-w-md mb-4">Selecciona un chat en la barra lateral para ver tus consultas, o crea una nueva conversación.</p>
                  <Button variant="default" onClick={handleNewConversation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Conversación
                  </Button>
                </div>
              ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  <div className={`max-w-2xl ${message.role === "user" ? "order-2" : ""}`}>
                    <Card
                      className={`${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none">
                          {message.content.split("\n").map((line, index) => {
                            if (line.startsWith("**") && line.endsWith("**")) {
                              return (
                                <h4 key={index} className="font-semibold my-2">
                                  {line.slice(2, -2)}
                                </h4>
                              );
                            }
                            return (
                              <p key={index} className="mb-2">
                                {line}
                              </p>
                            );
                          })}
                        </div>

                        {message.role === "assistant" && (
                          <>
                            {message.confidence !== undefined && (
                              <div className="flex items-center gap-2 mt-3">
                                <Badge variant="secondary" className="text-xs">
                                  Confianza: {(message.confidence * 100).toFixed(0)}%
                                </Badge>
                              </div>
                            )}

                            {message.evidences && message.evidences.length > 0 && (
                              <EvidenceChips evidences={message.evidences} />
                            )}

                            {message.type === "table" &&
                              Array.isArray(message.items) &&
                              message.items.length > 0 && (
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
                                            {item.url ? (
                                              <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                              >
                                                {item.name}
                                              </a>
                                            ) : (
                                              item.name
                                            )}
                                          </td>
                                          <td className="px-4 py-2">
                                            {item.brand ?? "-"}
                                          </td>
                                          <td className="px-4 py-2">
                                            {item.store ?? "-"}
                                          </td>
                                          <td className="px-4 py-2 text-right font-semibold">
                                            {item.price !== undefined
                                              ? `${item.price.toLocaleString(
                                                  "es-CO"
                                                )} ${item.currency ?? ""}`
                                              : "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                            {Array.isArray(message.sources) &&
                              message.sources.length > 0 && (
                                <div className="mt-3 text-xs text-gray-600">
                                  <p className="font-semibold mb-1">📚 Fuentes:</p>
                                  <ul className="list-disc pl-5">
                                    {message.sources.map((src, i) => (
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
                                        {src.score !== undefined && (
                                          <span className="ml-2 text-gray-400">
                                            ({(src.score * 100).toFixed(0)}% confianza)
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>modelo: {selectedModel}</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {message.role === "user" && (
                    <div className="flex-shrink-0 order-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-base">
                        <span aria-hidden>{userEmoji}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
              )}

              {(isLoading || isStreaming) && (
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
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {isStreaming ? "escribiendo..." : "conectando..."}
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
                        <span className="text-sm text-muted-foreground">
                          Error al enviar mensaje
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendMessage(retryRequest?.message ?? "")}
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
              <div className="border-t border-border p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* <h4 className="font-medium text-sm text-muted-foreground">
                    Generar visualización dinámica
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      value={figureQuery}
                      onChange={(e) => setFigureQuery(e.target.value)}
                      placeholder="Ej: Evolución de precios de tecnología en Q2"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleGeneratePlot}
                      disabled={isPlotLoading || !figureQuery.trim()}
                      variant="outline"
                    >
                      {isPlotLoading ? "Generando..." : "Visualizar"}
                    </Button>
                  </div> */}

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
                  variant="default"
                  size="icon"
                  className="h-12 w-12"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Presiona Shift+Enter para nueva línea</span>
                <span>Modo: {strictMode ? "Solo DB" : "IA Completa"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rename Chat Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar chat</DialogTitle>
            <DialogDescription>Escribe un nuevo título para esta conversación.</DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <Input
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              placeholder="Título del chat"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmRename}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Chat Confirm */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el chat y todos sus mensajes. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Chatbot;

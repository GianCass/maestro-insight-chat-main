import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";
import { Home, MessageSquare, RefreshCw, Settings as SettingsIcon, Check, LogOut, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import logoImage from "@/image/logo1.png";

type PerfilInteres = "economista" | "mercadologo" | "asesor";
const PERFIL_OPTIONS: PerfilInteres[] = ["economista", "mercadologo", "asesor"];
const DEFAULT_EMOJIS: string[] = [
  "😀","😃","😄","😁","😆","🥹","😊","🙂","🙃","😉","😌","😍","🥰","😘","😙","😚",
  "😎","🤓","🧐","🤠","😺","😸","😻","😼","😽","🙈","🙉","🙊","🐵","🐱","🦊","🐻",
  "🧠","📊","📈","💼","🧮","🧑‍💼","🧑‍🏫","🧑‍🔬","🧪","🕵️","🤖","👨‍💻","👩‍💻","🧑‍💻",
  "🎯","🚀","💡","🧩","🧲","🧪","⚙️","🔧","🔬","📚","📝","📌","📎","📅","🗂️","🗃️",
];

const Settings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [perfilInteres, setPerfilInteres] = useState<PerfilInteres | "">("");
  const [emoji, setEmoji] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [emojiOptions] = useState<string[]>(DEFAULT_EMOJIS); // lista fija de emojis
  const [loadingEmojis, setLoadingEmojis] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // perfiles are fixed options (economista, mercadologo, asesor)

  // Mensajes/consultas recientes del usuario
  type RecentMsg = { id: string; prompt: string | null; respuesta: string | null; created_at: string; chat_id: string };
  const [recentMsgs, setRecentMsgs] = useState<RecentMsg[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const canSave = useMemo(() => {
    const passOk = newPassword === confirmPassword || (!newPassword && !confirmPassword);
    return !!user && passOk && (displayName.length > 0 || perfilInteres !== "" || emoji !== "" || newPassword.length > 0);
  }, [user, displayName, perfilInteres, emoji, newPassword, confirmPassword]);

  useEffect(() => {
    document.title = "Configuración de Usuario - SPI";
  }, []);

  useEffect(() => {
    // Evita redirigir mientras carga o refresca sesión
    if (loading || refreshing) return;

    // Si el user sigue siendo null después de todo, ahí sí redirige
    if (!user) {
        navigate("/login");
        return;
    }

    const init = async () => {
        if (!user?.id) return;

        try {
        setRefreshing(true);
        // Espera a que la sesión esté estable
        const { data, error } = await supabase.auth.refreshSession();
        if (error) console.warn("Error refrescando sesión:", error);

        // Cargar perfil una vez refrescada
        const { data: profile, error: profileError } = await (supabase as any)
            .from("profiles")
            .select("name, profile_emoji, perfil_interes")
            .eq("id", user.id)
            .single();

        if (!profileError && profile) {
            const profName =
            profile.name ??
            user.user_metadata?.name ??
            user.email?.split("@")[0] ??
            "";
            setDisplayName(profName);
            setEmoji(profile.profile_emoji || "😀");
            const dbPerfil = String(profile.perfil_interes || "").toLowerCase();
            if (PERFIL_OPTIONS.includes(dbPerfil as PerfilInteres))
            setPerfilInteres(dbPerfil as PerfilInteres);
        }
        } catch (e) {
        console.error("Error inicializando perfil:", e);
        } finally {
        setRefreshing(false);
        setLoadingEmojis(false);
        }
    };

    init();
    }, [user, loading, navigate]);

  // Cargar consultas recientes (prompts) guardadas del usuario
  useEffect(() => {
    const loadRecent = async () => {
      if (!user?.id) return;
      setLoadingMsgs(true);
      try {
        // 1) Obtener los chats del usuario (ids)
        const { data: chats, error: chatsErr } = await (supabase as any)
          .from('chats')
          .select('id')
          .eq('user_id', user.id);
        if (chatsErr) throw chatsErr;
        const chatIds: string[] = (chats || []).map((c: any) => String(c.id));
        if (chatIds.length === 0) {
          setRecentMsgs([]);
          return;
        }

        // 2) Traer los mensajes de esos chats (últimos 20)
        const { data: msgs, error: msgsErr } = await (supabase as any)
          .from('messages')
          .select('id, prompt, respuesta, created_at, chat_id')
          .in('chat_id', chatIds)
          .order('created_at', { ascending: false })
          .limit(20);
        if (msgsErr) throw msgsErr;
        setRecentMsgs((msgs || []) as RecentMsg[]);
      } catch (e) {
        console.warn('No se pudieron cargar las consultas recientes:', e);
      } finally {
        setLoadingMsgs(false);
      }
    };
    loadRecent();
  }, [user?.id]);

  const handleOpenMessage = (chatId: string) => {
    try {
      // Señalar al Chatbot qué chat abrir
      localStorage.setItem('last-chat-id', chatId);
    } catch {}
    navigate('/chatbot');
  };


  const handleSave = async () => {
    if (!user) return;
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Por favor confirma tu nueva contraseña.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // 1) First, persist profile changes so when auth emits a change, the re-fetch sees updated data
      if (displayName || emoji || perfilInteres) {
        const { error: upsertErr } = await (supabase as any)
          .from("profiles")
          .upsert(
            {
              id: user.id,
              name: displayName || null,
              profile_emoji: emoji || null,
              perfil_interes: (perfilInteres as PerfilInteres) || null,
            },
            { onConflict: "id" }
          );
        if (upsertErr) throw upsertErr;
      }

      // 2) Then update auth metadata/password (this can trigger auth state change)
      if (displayName || newPassword) {
        const { error: updErr } = await supabase.auth.updateUser({
          data: displayName ? { name: displayName } : undefined,
          password: newPassword || undefined,
        });
        if (updErr) throw updErr;
      }

      toast({ title: "Datos guardados", description: "Tu perfil ha sido actualizado." });
      setNewPassword("");
      setConfirmPassword("");
      await new Promise((resolve) => setTimeout(resolve, 500)); // pequeña espera
        const { data: updatedProfile } = await (supabase as any)
        .from("profiles")
        .select("profile_emoji")
        .eq("id", user.id)
        .single();
        if (updatedProfile?.profile_emoji) {
        setEmoji(updatedProfile.profile_emoji);
        }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error al guardar", description: e?.message || "Intenta nuevamente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: "Sesión cerrada" });
      navigate("/login");
    } catch (e: any) {
      toast({ title: "No se pudo cerrar sesión", description: e?.message ?? "Intenta nuevamente.", variant: "destructive" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Invocar función edge: elimina profile y auth.user (requiere SERVICE_ROLE en la función)
      // No enviamos headers manuales: supabase-js adjunta el Authorization automáticamente
      const { data, error: fnErr } = await supabase.functions.invoke("delete-user-task", {
        // Enviar body vacío garantiza POST con application/json
        body: {},
      });
      if (fnErr) throw fnErr;
      if (!data?.success) {
        throw new Error(data?.error || "No se pudo eliminar la cuenta");
      }

      // Cerrar sesión después de eliminar
      await supabase.auth.signOut();
      toast({ title: "Cuenta eliminada", description: "Tu usuario y perfil han sido eliminados." });
      navigate("/register");
    } catch (e: any) {
      console.error(e);
      toast({ title: "No se pudo eliminar la cuenta", description: e?.message ?? "Intenta nuevamente.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar (based on Dashboard) */}
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
                <span className="text-lg font-semibold">Configuración de Usuario</span>
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
              <Button variant="ghost" size="icon" onClick={() => window.location.reload()} disabled={refreshing}>
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Perfil
              </CardTitle>
              <CardDescription>Administra la información de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-2xl">
                  {emoji || "🧑"}
                </div>
                <div>
                  <div className="font-semibold">{displayName || user?.email}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Datos de la cuenta</CardTitle>
              <CardDescription>Actualiza tu nombre, contraseña, emoji y perfil de interés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nombre de usuario</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" />
                </div>

                {/* Perfil de interés (fijo: Economista / Mercadologo / Asesor; guardado en minúsculas) */}
                <div className="space-y-2">
                  <Label>Perfil de interés</Label>
                  <Select value={perfilInteres || ""} onValueChange={(v) => setPerfilInteres(v as PerfilInteres)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economista">Economista</SelectItem>
                      <SelectItem value="mercadologo">Mercadologo</SelectItem>
                      <SelectItem value="asesor">Asesor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Nueva contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                  )}
                </div>

                {/* Emoji de perfil (lista fija) */}
                <div className="md:col-span-2 space-y-2">
                  <Label>Emoji de perfil</Label>
                  {loadingEmojis ? (
                    <div className="text-sm text-muted-foreground">Cargando emojis...</div>
                  ) : (
                    <div className="grid grid-cols-8 gap-2">
                      {emojiOptions.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setEmoji(e)}
                          className={`h-10 rounded-md border flex items-center justify-center text-xl hover:bg-muted transition ${emoji === e ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                          aria-label={`Elegir emoji ${e}`}
                        >
                          <span className="relative">
                            {e}
                            {emoji === e && <Check className="absolute -top-2 -right-2 h-4 w-4 text-primary" />}
                          </span>
                        </button>
                      ))}
                      {emojiOptions.length === 0 && (
                        <div className="col-span-8 text-sm text-muted-foreground">No hay emojis configurados.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button onClick={handleSave} disabled={!canSave || saving}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} disabled={saving}>Cancelar</Button>
              </div>

              {/* Acciones de sesión */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" onClick={handleLogout} className="justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar cuenta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar tu cuenta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará tu perfil en SPI. No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting}>
                        {deleting ? "Eliminando..." : "Sí, eliminar"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Consultas recientes (lado derecho, debajo de datos de cuenta) */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Consultas recientes</CardTitle>
              <CardDescription>Tu historial de prompts guardados recientemente</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMsgs ? (
                <div className="text-sm text-muted-foreground">Cargando…</div>
              ) : recentMsgs.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aún no hay consultas guardadas.</div>
              ) : (
                <div className="divide-y divide-border rounded-md border">
                  {recentMsgs.map((m) => {
                    const prompt = (m.prompt || '').toString();
                    const respuesta = (m.respuesta || '').toString();
                    const shortResp = respuesta.length > 160 ? `${respuesta.slice(0, 160)}…` : respuesta;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleOpenMessage(m.chat_id)}
                        className="w-full text-left p-3 rounded-md hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                        title={new Date(m.created_at).toLocaleString()}
                      >
                        <div className="text-sm font-medium text-foreground truncate">{prompt || '(sin contenido)'}</div>
                        {shortResp && (
                          <div className="text-xs text-muted-foreground mt-1 truncate">{shortResp}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;

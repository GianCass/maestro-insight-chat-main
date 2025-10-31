import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const UserAvatarLink = () => {
  const { user } = useAuth();
  const [emoji, setEmoji] = useState<string>("🧑");

  useEffect(() => {
    let isMounted = true;
    const loadEmoji = async () => {
      try {
        if (!user?.id) return;
        const { data } = await (supabase as any)
          .from("profiles")
          .select("profile_emoji")
          .eq("id", user.id)
          .single();
        if (isMounted && data?.profile_emoji) {
          setEmoji(data.profile_emoji as string);
        }
      } catch (e) {
        // Silenciar errores en navegación; se mantiene el emoji por defecto
        console.debug("No se pudo cargar profile_emoji:", e);
      }
    };

    loadEmoji();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <Link to="/settings" aria-label="Ir a Configuración de Usuario">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xl select-none">
        {emoji}
      </div>
    </Link>
  );
};

export default UserAvatarLink;

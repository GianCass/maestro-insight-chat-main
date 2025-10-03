// Supabase Authentication Service
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

class AuthService {
  async login(email: string, password: string): Promise<{ user: User; session: Session }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Error en el inicio de sesión');
    }

    return { user: data.user, session: data.session };
  }

  async register(email: string, password: string, name: string): Promise<{ user: User | null }> {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name,
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    return { user: data.user };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  }

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async getToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.access_token ?? null;
  }

  isAuthenticated(): boolean {
    // This will be determined by the auth state in components
    return false;
  }
}

export const authService = new AuthService();
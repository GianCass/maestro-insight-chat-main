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
      const rawMsg = (error.message || '').toLowerCase();
      const code = (error as any).code || '';
      const isDuplicate =
        code === 'user_already_registered' ||
        code === 'user_already_exists' ||
        rawMsg.includes('already registered') ||
        rawMsg.includes('already exists') ||
        rawMsg.includes('ya está registrado') ||
        rawMsg.includes('ya existe');

      if (isDuplicate) {
        const dupErr = new Error('EMAIL_ALREADY_REGISTERED');
        (dupErr as any).code = 'EMAIL_ALREADY_REGISTERED';
        throw dupErr;
      }

      throw new Error(error.message);
    }

    // Supabase edge case: if the email already exists but is unconfirmed,
    // signUp may succeed but return a user with empty identities array.
    // Treat this as "already registered" to block duplicate registrations.
    const identitiesLen = (data as any)?.user?.identities?.length;
    if (typeof identitiesLen === 'number' && identitiesLen === 0) {
      const dupErr = new Error('EMAIL_ALREADY_REGISTERED');
      (dupErr as any).code = 'EMAIL_ALREADY_REGISTERED';
      throw dupErr;
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
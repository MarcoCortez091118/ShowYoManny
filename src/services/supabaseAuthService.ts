import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
}

export interface AuthSession {
  user: AuthenticatedUser;
  token: string;
}

type SessionChangeCallback = (session: AuthSession | null) => void;

class SupabaseAuthService {
  private sessionCallbacks: Set<SessionChangeCallback> = new Set();
  private currentSession: AuthSession | null = null;

  async signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (data.user && !error) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        display_name: email.split('@')[0],
        roles: ['user'],
      });
    }

    return { user: data.user, error };
  }

  async signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { session: null, error };
    }

    if (data.session) {
      const session = await this.createAuthSession(data.session);
      this.setSession(session);
      return { session, error: null };
    }

    return { session: null, error: new Error('No session returned') };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.setSession(null);
  }

  async initializeFromStorage(): Promise<void> {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      const session = await this.createAuthSession(data.session);
      this.setSession(session);
    } else {
      this.setSession(null);
    }
  }

  private async createAuthSession(session: Session): Promise<AuthSession> {
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();

    const user: AuthenticatedUser = {
      id: session.user.id,
      email: session.user.email!,
      displayName: userData?.display_name || session.user.email!.split('@')[0],
      roles: userData?.roles || ['user'],
    };

    return {
      user,
      token: session.access_token,
    };
  }

  onSessionChanged(callback: SessionChangeCallback): () => void {
    this.sessionCallbacks.add(callback);

    callback(this.currentSession);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const authSession = await this.createAuthSession(session);
        this.setSession(authSession);
      } else if (event === 'SIGNED_OUT') {
        this.setSession(null);
      } else if (event === 'TOKEN_REFRESHED' && session) {
        const authSession = await this.createAuthSession(session);
        this.setSession(authSession);
      }
    });

    return () => {
      this.sessionCallbacks.delete(callback);
      authListener?.subscription.unsubscribe();
    };
  }

  private setSession(session: AuthSession | null): void {
    this.currentSession = session;
    this.sessionCallbacks.forEach((callback) => callback(session));
  }

  getSession(): AuthSession | null {
    return this.currentSession;
  }

  async refreshSession(): Promise<void> {
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      const session = await this.createAuthSession(data.session);
      this.setSession(session);
    }
  }

  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    await supabase
      .from('users')
      .update({ roles, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }
}

export const supabaseAuthService = new SupabaseAuthService();

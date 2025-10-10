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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('Email not confirmed')) {
          await this.clearSession();
        }
        return { session: null, error };
      }

      if (data.session) {
        try {
          const session = await this.createAuthSession(data.session);
          this.setSession(session);
          return { session, error: null };
        } catch (sessionError) {
          console.error('Failed to create auth session:', sessionError);
          await this.clearSession();
          return { session: null, error: sessionError };
        }
      }

      return { session: null, error: new Error('No session returned') };
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      await this.clearSession();
      return { session: null, error };
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await this.clearSession();
    }
  }

  async initializeFromStorage(): Promise<void> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session from storage:', error);
        await this.clearSession();
        return;
      }

      if (data.session) {
        try {
          const session = await this.createAuthSession(data.session);
          this.setSession(session);
        } catch (sessionError) {
          console.error('Failed to create auth session from storage:', sessionError);
          await this.clearSession();
        }
      } else {
        this.setSession(null);
      }
    } catch (error) {
      console.error('Unexpected error initializing from storage:', error);
      await this.clearSession();
    }
  }

  private async createAuthSession(session: Session): Promise<AuthSession> {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user data:', error);
        throw new Error('Failed to fetch user data from database');
      }

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
    } catch (error) {
      console.error('Failed to create auth session:', error);
      throw error;
    }
  }

  onSessionChanged(callback: SessionChangeCallback): () => void {
    this.sessionCallbacks.add(callback);

    callback(this.currentSession);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session) {
          const authSession = await this.createAuthSession(session);
          this.setSession(authSession);
        } else if (event === 'SIGNED_OUT') {
          this.setSession(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          const authSession = await this.createAuthSession(session);
          this.setSession(authSession);
        } else if (event === 'USER_UPDATED' && session) {
          const authSession = await this.createAuthSession(session);
          this.setSession(authSession);
        } else if (event === 'USER_DELETED' || (event === 'SIGNED_OUT' && !session)) {
          await this.clearSession();
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
        await this.clearSession();
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
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);
        await this.clearSession();
        return;
      }

      if (data.session) {
        const session = await this.createAuthSession(data.session);
        this.setSession(session);
      } else {
        await this.clearSession();
      }
    } catch (error) {
      console.error('Unexpected error refreshing session:', error);
      await this.clearSession();
    }
  }

  async updateUserRoles(userId: string, roles: string[]): Promise<void> {
    await supabase
      .from('users')
      .update({ roles, updated_at: new Date().toISOString() })
      .eq('id', userId);
  }

  async clearSession(): Promise<void> {
    try {
      this.setSession(null);

      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  async forceResetSession(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out during reset:', error);
    }
    await this.clearSession();
  }

  isSessionValid(): boolean {
    return this.currentSession !== null;
  }
}

export const supabaseAuthService = new SupabaseAuthService();

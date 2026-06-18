import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/services/logger';

const logger = createLogger('AuthContext');

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearSessions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const finish = (resolvedUser: User | null) => {
      if (!mounted || resolved) return;
      resolved = true;
      setUser(resolvedUser);
      setLoading(false);
    };

    const resolveUser = async (userId: string, email: string): Promise<User> => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, roles')
          .eq('id', userId)
          .maybeSingle();

        if (userData) {
          return {
            id: userData.id,
            email: userData.email,
            roles: userData.roles || ['user'],
          };
        }
      } catch (e) {
        logger.error('Error fetching user data', { error: e });
      }
      return { id: userId, email, roles: ['user'] };
    };

    // Safety timeout - never stay loading more than 5 seconds
    const timeout = setTimeout(() => {
      if (!resolved && mounted) {
        logger.warn('Auth initialization timed out, proceeding without session');
        finish(null);
      }
    }, 5000);

    // Primary: use getSession to check initial state
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        logger.error('getSession error', { error: error.message });
        finish(null);
        return;
      }

      if (session?.user) {
        const resolvedUser = await resolveUser(session.user.id, session.user.email!);
        finish(resolvedUser);
      } else {
        finish(null);
      }
    }).catch(() => {
      finish(null);
    });

    // Secondary: listen for future auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Skip initial session event since getSession handles it
      if (event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const resolvedUser = await resolveUser(session.user.id, session.user.email!);
        if (mounted) {
          setUser(resolvedUser);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authService.signIn(email, password);

      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      logger.error('Unexpected error in signIn', { error: error.message });
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      logger.error('Error during sign out', { error });
      setUser(null);
    }
  };

  const clearSessions = async () => {
    try {
      await authService.clearAllSessions();
      setUser(null);
    } catch (error) {
      logger.error('Error clearing sessions', { error });
    }
  };

  const isAdmin = user?.roles?.includes('admin') || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signIn,
        signOut,
        clearSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

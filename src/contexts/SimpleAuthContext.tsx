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

    const resolveUser = async (supabaseUserId: string, email: string): Promise<User> => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, roles')
          .eq('id', supabaseUserId)
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
      return { id: supabaseUserId, email, roles: ['user'] };
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.debug('Auth state changed', { event, hasSession: !!session });

      if (!mounted) return;

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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        const resolvedUser = await resolveUser(session.user.id, session.user.email!);
        if (mounted) {
          setUser(resolvedUser);
          setLoading(false);
        }
      } else {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    logger.info('Sign in requested', { email });

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

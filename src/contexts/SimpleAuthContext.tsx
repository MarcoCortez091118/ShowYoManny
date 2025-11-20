import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '@/services/authService';
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
    logger.info('Initializing auth context');
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    logger.debug('Checking for existing session');
    setLoading(true);

    try {
      const currentUser = await authService.getCurrentSession();
      if (currentUser) {
        logger.info('Existing session found', { userId: currentUser.id });
        setUser(currentUser);
      } else {
        logger.debug('No existing session');
        setUser(null);
      }
    } catch (error) {
      logger.error('Error initializing auth', { error });
      setUser(null);
    } finally {
      setLoading(false);
      logger.debug('Auth initialization complete');
    }
  };

  const signIn = async (email: string, password: string) => {
    logger.info('Sign in requested', { email });

    try {
      const result = await authService.signIn(email, password);

      if (result.success && result.user) {
        logger.info('Sign in successful, updating context', { userId: result.user.id });
        setUser(result.user);
        return { success: true };
      } else {
        logger.warn('Sign in failed', { error: result.error });
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      logger.error('Unexpected error in signIn', { error: error.message });
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    logger.info('Sign out requested');

    try {
      await authService.signOut();
      setUser(null);
      logger.info('Sign out successful');
    } catch (error) {
      logger.error('Error during sign out', { error });
      setUser(null);
    }
  };

  const clearSessions = async () => {
    logger.info('Clear sessions requested');

    try {
      await authService.clearAllSessions();
      setUser(null);
      logger.info('Sessions cleared');
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

import { supabase } from '@/lib/supabase';
import { createLogger } from './logger';

const logger = createLogger('AuthService');

export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
}

class AuthService {
  async signIn(email: string, password: string): Promise<LoginResult> {
    logger.info('Starting sign in process', { email });

    try {
      logger.debug('Step 1: Calling Supabase signInWithPassword');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logger.error('Step 1 Failed: Supabase auth error', {
          error: error.message,
          status: error.status
        });
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.session) {
        logger.error('Step 1 Failed: No session returned');
        return {
          success: false,
          error: 'No session created'
        };
      }

      logger.info('Step 1 Success: Supabase session created', {
        userId: data.user.id
      });

      logger.debug('Step 2: Fetching user data from database');
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('id, email, roles')
        .eq('id', data.user.id)
        .maybeSingle();

      if (dbError) {
        logger.error('Step 2 Failed: Database query error', {
          error: dbError.message
        });
        return {
          success: false,
          error: 'Failed to fetch user data'
        };
      }

      if (!userData) {
        logger.warn('Step 2: No user record found in database, using auth data');
        const user: User = {
          id: data.user.id,
          email: data.user.email!,
          roles: ['user'],
        };
        logger.info('Sign in completed with default roles', { user });
        return { success: true, user };
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        roles: userData.roles || ['user'],
      };

      logger.info('Step 2 Success: User data fetched', { user });
      logger.info('Sign in completed successfully', { userId: user.id });

      return { success: true, user };
    } catch (error: any) {
      logger.error('Unexpected error during sign in', {
        error: error.message,
        stack: error.stack
      });
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  async signOut(): Promise<void> {
    logger.info('Starting sign out process');

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logger.error('Sign out error', { error: error.message });
        throw error;
      }

      logger.info('Sign out completed successfully');
    } catch (error: any) {
      logger.error('Unexpected error during sign out', {
        error: error.message
      });
      throw error;
    }
  }

  async getCurrentSession(): Promise<User | null> {
    logger.debug('Checking current session');

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        logger.error('Error getting session', { error: error.message });
        return null;
      }

      if (!data.session) {
        logger.debug('No active session found');
        return null;
      }

      logger.debug('Active session found', { userId: data.session.user.id });

      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('id, email, roles')
        .eq('id', data.session.user.id)
        .maybeSingle();

      if (dbError || !userData) {
        logger.warn('Could not fetch user data, using auth data');
        return {
          id: data.session.user.id,
          email: data.session.user.email!,
          roles: ['user'],
        };
      }

      logger.debug('User data fetched from database');
      return {
        id: userData.id,
        email: userData.email,
        roles: userData.roles || ['user'],
      };
    } catch (error: any) {
      logger.error('Unexpected error getting session', {
        error: error.message
      });
      return null;
    }
  }

  async clearAllSessions(): Promise<void> {
    logger.info('Clearing all sessions and local storage');

    try {
      await supabase.auth.signOut();

      if (typeof window !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }

        logger.debug('Removing localStorage keys', { count: keysToRemove.length });
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      logger.info('All sessions cleared successfully');
    } catch (error: any) {
      logger.error('Error clearing sessions', { error: error.message });
    }
  }
}

export const authService = new AuthService();

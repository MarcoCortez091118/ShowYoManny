import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/services/logger';

const logger = createLogger('AdminLoginPage');

const SimpleAdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, loading: authLoading, signIn, clearSessions } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    logger.info('Login page mounted', { authLoading, hasUser: !!user, isAdmin });

    if (!authLoading && user && isAdmin) {
      logger.info('User already authenticated, redirecting to dashboard');
      navigate('/admin', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleClearSessions = async () => {
    logger.info('User requested to clear sessions');
    setIsSubmitting(true);

    try {
      await clearSessions();
      toast({
        title: 'Sessions Cleared',
        description: 'All cached data has been removed. You can now try logging in again.',
      });
      setAttemptCount(0);
      setErrorMessage('');
      setEmail('');
      setPassword('');
      logger.info('Sessions cleared successfully');
    } catch (error) {
      logger.error('Failed to clear sessions', { error });
      toast({
        title: 'Error',
        description: 'Failed to clear sessions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info('Login form submitted', { email });

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      logger.debug('Validating form inputs');

      if (!email || !password) {
        const error = 'Please enter both email and password';
        logger.warn('Validation failed', { error });
        setErrorMessage(error);
        setIsSubmitting(false);
        return;
      }

      logger.debug('Form validation passed, calling signIn');
      const result = await signIn(email, password);

      if (result.success) {
        logger.info('Login successful, showing success toast');
        toast({
          title: 'Login Successful',
          description: 'Welcome to the admin dashboard',
        });

        logger.info('Navigating to dashboard');
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 100);
      } else {
        logger.warn('Login failed', { error: result.error });
        setAttemptCount(prev => prev + 1);
        setErrorMessage(result.error || 'Login failed');

        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      logger.error('Unexpected error during login', {
        error: error.message,
        stack: error.stack
      });

      setAttemptCount(prev => prev + 1);
      setErrorMessage('An unexpected error occurred. Please try again.');

      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      logger.debug('Login attempt completed');
    }
  };

  if (authLoading) {
    logger.debug('Rendering loading state');
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking authentication...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  logger.debug('Rendering login form');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Sign in to access the admin dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="admin@showyo.app"
                disabled={isSubmitting}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="Enter your password"
                disabled={isSubmitting}
                required
                autoComplete="current-password"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              variant="default"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {attemptCount >= 2 && (
            <div className="mt-4 p-3 bg-muted rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground mb-2">
                Having trouble logging in? Try clearing your session cache.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSessions}
                disabled={isSubmitting}
                className="w-full"
              >
                Clear Sessions & Retry
              </Button>
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Open browser console (F12) to view detailed logs
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAdminLogin;

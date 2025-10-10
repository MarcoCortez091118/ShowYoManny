import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseAuthService } from "@/services/supabaseAuthService";
import { useAuth } from "@/contexts/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh, user, isAdmin } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  React.useEffect(() => {
    if (user && isAdmin) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath || '/admin', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleClearSession = async () => {
    setIsLoading(true);
    try {
      await supabaseAuthService.forceResetSession();
      toast({
        title: "Session Cleared",
        description: "All cached data has been cleared. Please try logging in again.",
      });
      setCredentials({ email: '', password: '' });
      setAttemptCount(0);
    } catch (error) {
      console.error('Error clearing session:', error);
      toast({
        title: "Clear Failed",
        description: "Failed to clear session data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { session, error } = await supabaseAuthService.signIn(
        credentials.email,
        credentials.password
      );

      if (error || !session) {
        setAttemptCount(prev => prev + 1);

        const errorMessage = error?.message || 'Login failed';
        const shouldSuggestClear = attemptCount >= 2 || errorMessage.includes('session') || errorMessage.includes('token');

        throw new Error(errorMessage);
      }

      await refresh();

      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard",
      });

      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectPath || '/admin', { replace: true });
    } catch (error: any) {
      const errorMessage = error?.message || "Invalid username or password";
      const shouldSuggestClear = attemptCount >= 2;

      toast({
        title: "Login Failed",
        description: shouldSuggestClear
          ? `${errorMessage}. Try clearing your session below.`
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Sign in to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                placeholder="admin@showyo.app"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              variant="electric"
              disabled={isLoading}
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {attemptCount >= 2 && (
            <div className="mt-4 p-3 bg-muted rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground mb-2">
                Having trouble logging in? Try clearing your session data.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSession}
                disabled={isLoading}
                className="w-full"
              >
                Clear Session & Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
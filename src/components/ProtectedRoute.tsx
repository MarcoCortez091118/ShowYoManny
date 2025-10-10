import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  redirectTo = '/admin-login'
}: ProtectedRouteProps) => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        const currentPath = window.location.pathname;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        navigate(redirectTo, { replace: true });
      } else if (requireAdmin && !isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [user, isAdmin, loading, navigate, redirectTo, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Redirecting to login...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Administrator privileges are required to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You are logged in but do not have the necessary permissions.
            </p>
            <button
              onClick={() => navigate('/')}
              className="text-primary hover:underline"
            >
              Return to Home
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

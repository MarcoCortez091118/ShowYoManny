import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthenticatedUser,
  AuthSession,
  firebaseAuthService,
} from "@/domain/services/firebase/authService";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  session: AuthSession | null;
  token: string | null;
  isAdmin: boolean;
  loading: boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    firebaseAuthService
      .initializeFromStorage()
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    const unsubscribe = firebaseAuthService.onSessionChanged((newSession) => {
      if (!isMounted) return;
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await firebaseAuthService.logout();
  };

  const refresh = async () => {
    await firebaseAuthService.initializeFromStorage();
  };

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null;
    const roles = user?.roles ?? [];
    const isAdmin = roles.includes("admin");

    return {
      user,
      session,
      token: session?.token ?? null,
      isAdmin,
      loading,
      logout,
      refresh,
    };
  }, [session, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

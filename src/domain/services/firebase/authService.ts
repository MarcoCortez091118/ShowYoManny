import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName?: string | null;
  roles: string[];
}

export interface AuthSession {
  token: string;
  user: AuthenticatedUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

type SessionListener = (session: AuthSession | null) => void;

const TOKEN_STORAGE_KEY = "showyo.firebase.token";

export class FirebaseAuthService {
  private session: AuthSession | null = null;
  private readonly listeners = new Set<SessionListener>();

  constructor(private readonly api: FirebaseApiClient) {}

  get currentSession(): AuthSession | null {
    return this.session;
  }

  get token(): string | null {
    return this.session?.token ?? localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  onSessionChanged(listener: SessionListener): () => void {
    this.listeners.add(listener);
    listener(this.session);
    return () => this.listeners.delete(listener);
  }

  private notify(session: AuthSession | null) {
    this.listeners.forEach((listener) => listener(session));
  }

  async initializeFromStorage(): Promise<void> {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      this.session = null;
      this.notify(this.session);
      return;
    }

    try {
      const user = await this.api.request<AuthenticatedUser>("auth/session", {
        method: "GET",
        token: storedToken,
      });

      this.session = { token: storedToken, user };
      this.notify(this.session);
    } catch (error) {
      console.warn("Failed to restore Firebase session, clearing token", error);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      this.session = null;
      this.notify(this.session);
    }
  }

  async login(credentials: LoginPayload): Promise<AuthenticatedUser> {
    const { token, user } = await this.api.request<AuthSession>("auth/login", {
      method: "POST",
      body: credentials,
    });

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.session = { token, user };
    this.notify(this.session);
    return user;
  }

  async logout(): Promise<void> {
    const token = this.session?.token ?? localStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      try {
        await this.api.request("auth/logout", { method: "POST", token });
      } catch (error) {
        console.warn("Failed to notify Firebase backend about logout", error);
      }
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.session = null;
    this.notify(this.session);
  }
}

export const firebaseAuthService = new FirebaseAuthService(firebaseApiClient);

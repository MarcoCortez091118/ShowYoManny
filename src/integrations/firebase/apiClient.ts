import { isPlainObject } from "@/lib/utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface FirebaseApiRequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  token?: string | null;
}

export interface ApiErrorPayload {
  error: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
}

const FIREBASE_API_BASE_URL = import.meta.env.VITE_FIREBASE_API_BASE_URL;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_REGION = import.meta.env.VITE_FIREBASE_REGION ?? "us-central1";

function resolveBaseUrl(): string | undefined {
  if (FIREBASE_API_BASE_URL) {
    return FIREBASE_API_BASE_URL;
  }

  if (FIREBASE_PROJECT_ID) {
    return `https://${FIREBASE_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;
  }

  console.warn(
    "Neither VITE_FIREBASE_API_BASE_URL nor VITE_FIREBASE_PROJECT_ID are defined. Firebase API client calls will fail until one is configured."
  );

  return undefined;
}

function buildQueryString(query?: FirebaseApiRequestOptions["query"]): string {
  if (!query) return "";

  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isFormData(body)) {
    return body;
  }

  if (body instanceof Blob || body instanceof ArrayBuffer) {
    return body;
  }

  if (typeof body === "string") {
    return body;
  }

  if (isPlainObject(body)) {
    return JSON.stringify(body);
  }

  console.warn("Unsupported request body type provided to FirebaseApiClient", body);
  return undefined;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  // Fallback to text when JSON is not available
  const text = await response.text();
  return text as unknown as T;
}

export class FirebaseApiClient {
  constructor(private readonly baseUrl: string | undefined) {}

  async request<T = unknown>(path: string, options: FirebaseApiRequestOptions = {}): Promise<T> {
    if (!this.baseUrl) {
      throw new Error("Firebase API base URL is not configured");
    }

    const { method = "GET", query, body, headers = {}, signal, token } = options;

    const url = `${this.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}${buildQueryString(query)}`;

    const requestHeaders = new Headers(headers);

    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    if (body && !isFormData(body) && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: serializeBody(body),
      signal,
    });

    if (!response.ok) {
      const errorPayload = await parseResponse<ApiErrorPayload | string>(response).catch(() => undefined);

      const error = new Error(
        typeof errorPayload === "string"
          ? errorPayload
          : errorPayload?.message || `Firebase API request failed with status ${response.status}`
      ) as Error & { details?: unknown; status?: number };

      if (typeof errorPayload !== "string" && errorPayload) {
        error.details = errorPayload.details;
        error.status = errorPayload.statusCode ?? response.status;
      } else {
        error.status = response.status;
      }

      throw error;
    }

    return parseResponse<T>(response);
  }
}

export const firebaseApiClient = new FirebaseApiClient(resolveBaseUrl());

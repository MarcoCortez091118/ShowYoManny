import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";
import { firebaseAuthService } from "./authService";

export interface CreateCheckoutSessionInput {
  orderId: string;
  planId: string;
  userEmail: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}

export interface ConfirmPaymentInput {
  orderId: string;
  sessionId: string;
}

export class FirebasePaymentService {
  constructor(
    private readonly api: FirebaseApiClient,
    private readonly auth = firebaseAuthService
  ) {}

  private get token(): string | null {
    return this.auth.token;
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResponse> {
    return this.api.request<CreateCheckoutSessionResponse>("payments/create-checkout-session", {
      method: "POST",
      body: input,
    });
  }

  async confirmPayment(input: ConfirmPaymentInput): Promise<void> {
    await this.api.request("payments/confirm", {
      method: "POST",
      body: input,
      token: this.token,
    });
  }
}

export const firebasePaymentService = new FirebasePaymentService(firebaseApiClient);

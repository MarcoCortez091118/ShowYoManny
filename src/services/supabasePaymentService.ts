import { supabase } from '@/lib/supabase';

export interface CreateCheckoutSessionInput {
  orderId: string;
  planId: string;
  stripePriceId: string;
  userEmail: string;
  mediaUrl: string;
  title: string;
}

export interface CreateCheckoutSessionResponse {
  url: string;
  sessionId: string;
}

class SupabasePaymentService {
  private getSupabaseUrl(): string {
    return import.meta.env.VITE_SUPABASE_URL;
  }

  private getAnonKey(): string {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionResponse> {
    try {
      const supabaseUrl = this.getSupabaseUrl();
      const anonKey = this.getAnonKey();

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration is missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          order_id: input.orderId,
          plan_id: input.planId,
          stripe_price_id: input.stripePriceId,
          user_email: input.userEmail,
          media_url: input.mediaUrl,
          title: input.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error('No checkout URL returned from server');
      }

      return {
        url: data.url,
        sessionId: data.sessionId || '',
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  async confirmPayment(orderId: string, sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('queue_items')
        .update({
          status: 'completed',
          moderation_status: 'pending',
          display_status: 'pending',
        })
        .eq('id', orderId);

      if (error) {
        throw new Error(`Failed to confirm payment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
}

export const supabasePaymentService = new SupabasePaymentService();

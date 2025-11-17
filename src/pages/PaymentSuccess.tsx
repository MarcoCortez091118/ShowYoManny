import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      const orderId = searchParams.get('order_id');
      const sessionId = searchParams.get('session_id');

      if (!orderId || !sessionId) {
        toast({
          title: "Error",
          description: "Missing payment information",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/confirm-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            order_id: orderId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to confirm payment');
        }

        toast({
          title: "Payment Successful! 🎉",
          description: "Your content is now active on the billboard for 24 hours!",
        });

        setIsProcessing(false);
      } catch (error) {
        console.error('Payment processing error:', error);
        toast({
          title: "Processing Error",
          description: "Payment received but content processing failed. Please contact support.",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {isProcessing ? (
                <>
                  <Clock className="h-6 w-6 animate-spin" />
                  Processing Your Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Payment Successful!
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isProcessing ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Please wait while we process your content and prepare it for display...
                </p>
              </div>
            ) : (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
                  <p className="text-muted-foreground">
                    Your payment has been processed successfully and your content is now active on the billboard!
                  </p>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✅ Payment confirmed</p>
                  <p>✅ Content activated</p>
                  <p>🎬 Now displaying on billboard</p>
                  <p className="text-xs mt-4">
                    Your content will display on the billboard for 24 hours and will be automatically removed after that period.
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => navigate('/')}
                    variant="default"
                    className="flex-1"
                  >
                    Return Home
                  </Button>
                  <Button 
                    onClick={() => navigate('/upload')}
                    variant="outline"
                    className="flex-1"
                  >
                    Upload More
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;

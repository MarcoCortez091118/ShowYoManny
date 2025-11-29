import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, DollarSign, Clock, Mail, User, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';

interface OrphanedPayment {
  tracking_id: string;
  customer_email: string;
  customer_name: string;
  amount_cents: number;
  payment_intent_id: string;
  session_id: string;
  payment_timestamp: string;
  hours_since_payment: string;
  failure_reason: string | null;
}

export default function AdminOrphanedPayments() {
  const [orphanedPayments, setOrphanedPayments] = useState<OrphanedPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrphanedPayments = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase.rpc('find_orphaned_payments');

      if (queryError) {
        throw queryError;
      }

      setOrphanedPayments(data || []);
    } catch (err: any) {
      console.error('Error fetching orphaned payments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphanedPayments();
  }, []);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUrgencyBadge = (hours: number) => {
    if (hours < 1) {
      return <Badge variant="destructive">URGENT - Less than 1 hour</Badge>;
    } else if (hours < 24) {
      return <Badge variant="destructive">Critical - Less than 24 hours</Badge>;
    } else if (hours < 72) {
      return <Badge className="bg-orange-500">Warning - {Math.floor(hours)} hours ago</Badge>;
    } else {
      return <Badge variant="secondary">{Math.floor(hours)} hours ago</Badge>;
    }
  };

  const totalLostRevenue = orphanedPayments.reduce((sum, payment) => sum + payment.amount_cents, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orphaned Payments</h1>
            <p className="text-gray-600 mt-1">
              Payments received but content not activated
            </p>
          </div>
          <Button onClick={fetchOrphanedPayments} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {orphanedPayments.length > 0 && (
          <Alert className="mb-6 border-orange-500 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>{orphanedPayments.length}</strong> payment(s) need attention.
              Total revenue at risk: <strong>{formatCurrency(totalLostRevenue)}</strong>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orphaned payments...</p>
          </div>
        ) : orphanedPayments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
              <p className="text-gray-600">No orphaned payments found. All payments have been successfully activated.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orphanedPayments.map((payment) => (
              <Card key={payment.tracking_id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        {formatCurrency(payment.amount_cents)}
                      </CardTitle>
                      <CardDescription>
                        Payment Intent: <code className="text-xs bg-gray-100 px-2 py-1 rounded">{payment.payment_intent_id}</code>
                      </CardDescription>
                    </div>
                    {getUrgencyBadge(parseFloat(payment.hours_since_payment))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{payment.customer_name}</p>
                        <p className="text-xs text-gray-500">Customer Name</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{payment.customer_email}</p>
                        <p className="text-xs text-gray-500">Customer Email</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{formatDate(payment.payment_timestamp)}</p>
                        <p className="text-xs text-gray-500">Payment Date</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">
                          {payment.failure_reason || 'No order_id - User did not upload content'}
                        </p>
                        <p className="text-xs text-gray-500">Failure Reason</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm font-semibold">Recommended Actions:</p>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Contact customer at {payment.customer_email} to verify if they uploaded content</li>
                      <li>Check Stripe Dashboard for session {payment.session_id.substring(0, 20)}...</li>
                      <li>If no content was uploaded, consider issuing a refund</li>
                      <li>Review audit logs for webhook processing errors</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://dashboard.stripe.com/payments/${payment.payment_intent_id}`, '_blank')}
                    >
                      View in Stripe
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const subject = encodeURIComponent('Issue with your ShowYo content upload');
                        const body = encodeURIComponent(
                          `Hi ${payment.customer_name},\n\n` +
                          `We received your payment of ${formatCurrency(payment.amount_cents)} but we don't have a record of your content upload.\n\n` +
                          `Could you please let us know if you uploaded content after making the payment?\n\n` +
                          `If you need help completing your order, we're happy to assist.\n\n` +
                          `Best regards,\nShowYo Team`
                        );
                        window.location.href = `mailto:${payment.customer_email}?subject=${subject}&body=${body}`;
                      }}
                    >
                      Email Customer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  created_at: string;
  user_email: string;
  price_cents: number;
  status: string;
  pricing_option_id: string;
  file_name: string;
}

const AdminBilling = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data);
      const total = data.reduce((sum, order) => sum + (order.price_cents || 0), 0);
      setTotalRevenue(total / 100); // Convert cents to dollars
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-8 h-8 text-primary" />
                <div>
                  <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{order.file_name || 'Unnamed'}</div>
                      <div className="text-sm text-muted-foreground">{order.user_email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge>{order.pricing_option_id}</Badge>
                      <div className="text-right">
                        <div className="font-medium">${((order.price_cents || 0) / 100).toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminBilling;

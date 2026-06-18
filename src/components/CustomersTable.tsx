import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users, Mail, Package, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  stripe_customer_id: string | null;
  total_purchases: number;
  total_spent: number;
  first_purchase_at: string | null;
  last_purchase_at: string | null;
  customer_segment: string;
  created_at: string;
  last_package: string | null;
}

const PAGE_SIZE = 10;

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const { data: ordersData } = await supabase
        .from('stripe_orders')
        .select('customer_id, amount_total, created_at, metadata')
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      const ordersByCustomer: Record<string, { count: number; totalSpent: number; lastPlanId: string | null; lastOrderDate: string | null }> = {};

      for (const order of ordersData || []) {
        if (!order.customer_id) continue;
        if (!ordersByCustomer[order.customer_id]) {
          const meta = order.metadata as any;
          ordersByCustomer[order.customer_id] = {
            count: 0,
            totalSpent: 0,
            lastPlanId: meta?.plan_id || null,
            lastOrderDate: order.created_at,
          };
        }
        ordersByCustomer[order.customer_id].count++;
        ordersByCustomer[order.customer_id].totalSpent += Number(order.amount_total) / 100;
      }

      const enriched: Customer[] = (customersData || []).map(customer => {
        const stats = ordersByCustomer[customer.stripe_customer_id || ''];
        const purchases = stats?.count || 0;
        const spent = stats?.totalSpent || 0;

        let segment = customer.customer_segment || 'new';
        if (purchases === 0) segment = 'new';
        else if (purchases === 1) segment = 'new';
        else if (purchases >= 5) segment = 'vip';
        else if (purchases > 1) segment = 'returning';

        return {
          ...customer,
          total_purchases: purchases,
          total_spent: spent,
          last_package: stats?.lastPlanId || null,
          last_purchase_at: stats?.lastOrderDate || customer.last_purchase_at,
          customer_segment: segment,
        };
      });

      setCustomers(enriched);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (searchTerm.trim() === '') return customers;
    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.email.toLowerCase().includes(term) ||
      customer.name?.toLowerCase().includes(term) ||
      customer.stripe_customer_id?.toLowerCase().includes(term)
    );
  }, [searchTerm, customers]);

  const totalPages = Math.ceil(filteredCustomers.length / PAGE_SIZE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, currentPage]);

  const exportToCSV = () => {
    if (filteredCustomers.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay clientes para exportar",
        variant: "destructive",
      });
      return;
    }

    const csvHeaders = [
      'Email', 'Name', 'Phone', 'Customer ID', 'Total Purchases',
      'Total Spent', 'Last Package', 'Customer Segment', 'First Purchase',
      'Last Purchase', 'Created At'
    ];

    const csvRows = filteredCustomers.map(customer => [
      customer.email,
      customer.name || '',
      customer.phone || '',
      customer.stripe_customer_id || '',
      customer.total_purchases,
      customer.total_spent.toFixed(2),
      customer.last_package || 'N/A',
      customer.customer_segment,
      customer.first_purchase_at ? new Date(customer.first_purchase_at).toLocaleDateString() : '',
      customer.last_purchase_at ? new Date(customer.last_purchase_at).toLocaleDateString() : '',
      new Date(customer.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row =>
        row.map(cell => {
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportacion exitosa",
      description: `${filteredCustomers.length} clientes exportados a CSV`,
    });
  };

  const formatPlanName = (planId: string) => {
    const names: Record<string, string> = {
      'photo-clean': 'Foto Limpia',
      'photo-border': 'Foto + Marco',
      'photo-logo': 'Foto + Logo',
      'video-clean': 'Video Limpio',
      'video-border': 'Video + Marco',
      'video-logo': 'Video + Logo',
    };
    return names[planId] || planId;
  };

  const getSegmentBadge = (segment: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'new': { variant: 'default', label: 'Nuevo' },
      'returning': { variant: 'secondary', label: 'Recurrente' },
      'vip': { variant: 'outline', label: 'VIP' },
      'inactive': { variant: 'destructive', label: 'Inactivo' }
    };
    const config = variants[segment] || { variant: 'outline', label: segment };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Base de Clientes
            </CardTitle>
            <CardDescription>
              Gestiona y exporta tu lista de contactos para Mailchimp
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} className="gap-2" variant="outline">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="text-sm whitespace-nowrap">
            {filteredCustomers.length} clientes
          </Badge>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Cargando clientes...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Nombre</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">ID Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Ultimo Paquete
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Compras
                      </div>
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Total Gastado</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Segmento</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{customer.email}</span>
                          {customer.phone && (
                            <span className="text-xs text-muted-foreground">{customer.phone}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {customer.name || <span className="text-muted-foreground italic">Sin nombre</span>}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {customer.stripe_customer_id?.substring(0, 12) || 'N/A'}...
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {customer.last_package ? (
                          <Badge variant="secondary" className="text-xs">
                            {formatPlanName(customer.last_package)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground italic">Sin compras</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="font-mono">
                          {customer.total_purchases}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-semibold text-sm">
                        {formatCurrency(customer.total_spent)}
                      </td>
                      <td className="py-3 px-4">
                        {getSegmentBadge(customer.customer_segment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(currentPage * PAGE_SIZE, filteredCustomers.length)} de {filteredCustomers.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {!loading && filteredCustomers.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{filteredCustomers.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Compras Totales</p>
                <p className="text-2xl font-bold">
                  {filteredCustomers.reduce((sum, c) => sum + c.total_purchases, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.total_spent, 0))}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Promedio por Cliente</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    filteredCustomers.reduce((sum, c) => sum + c.total_spent, 0) /
                    (filteredCustomers.filter(c => c.total_purchases > 0).length || 1)
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Users, Mail, Package, TrendingUp } from "lucide-react";
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
  last_package?: string | null;
}

export function CustomersTable() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const customersWithPackages = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: orders } = await supabase
            .from('stripe_orders')
            .select('metadata')
            .eq('customer_id', customer.stripe_customer_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          let lastPackage = null;
          if (orders?.metadata) {
            const metadata = orders.metadata as any;
            lastPackage = metadata.plan_name || metadata.planName || null;
          }

          return {
            ...customer,
            last_package: lastPackage
          };
        })
      );

      setCustomers(customersWithPackages);
      setFilteredCustomers(customersWithPackages);
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
      'Email',
      'Name',
      'Phone',
      'Customer ID',
      'Total Purchases',
      'Total Spent',
      'Last Package',
      'Customer Segment',
      'First Purchase',
      'Last Purchase',
      'Created At'
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
      title: "Exportación exitosa",
      description: `${filteredCustomers.length} clientes exportados a CSV`,
    });
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
          <Badge variant="outline" className="text-sm">
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
                      Último Paquete
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
                {filteredCustomers.map((customer) => (
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
                          {customer.last_package}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {customer.total_purchases}
                        </Badge>
                      </div>
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
                    filteredCustomers.length
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

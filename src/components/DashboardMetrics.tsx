import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Package, Users, UserPlus, CalendarIcon, TrendingUp } from "lucide-react";
import { format, subDays, subWeeks, subMonths, subYears, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/lib/supabase";

type DateRange = 'day' | 'week' | 'month' | 'year' | 'custom';

interface MetricsData {
  totalRevenue: number;
  processingRevenue: number;
  completedRevenue: number;
  totalPackages: number;
  newCustomers: number;
  returningCustomers: number;
  packagesByType: {
    photo: number;
    video: number;
  };
}

export function DashboardMetrics() {
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [metrics, setMetrics] = useState<MetricsData>({
    totalRevenue: 0,
    processingRevenue: 0,
    completedRevenue: 0,
    totalPackages: 0,
    newCustomers: 0,
    returningCustomers: 0,
    packagesByType: { photo: 0, video: 0 }
  });
  const [loading, setLoading] = useState(true);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (dateRange) {
      case 'day':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfDay(subDays(now, 7));
        break;
      case 'month':
        startDate = startOfDay(subMonths(now, 1));
        break;
      case 'year':
        startDate = startOfDay(subYears(now, 1));
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return null;
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default:
        startDate = startOfDay(subDays(now, 7));
    }

    return { startDate, endDate };
  };

  const fetchMetrics = async () => {
    const dateFilter = getDateRangeFilter();
    if (!dateFilter) return;

    setLoading(true);

    try {
      const { startDate, endDate } = dateFilter;

      const { data: orders, error: ordersError } = await supabase
        .from('stripe_orders')
        .select('amount_total, payment_status, status, customer_id, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount_total / 100), 0) || 0;
      const processingRevenue = orders?.filter(o => o.status === 'pending').reduce((sum, order) => sum + (order.amount_total / 100), 0) || 0;
      const completedRevenue = orders?.filter(o => o.status === 'completed').reduce((sum, order) => sum + (order.amount_total / 100), 0) || 0;

      const { data: packages, error: packagesError } = await supabase
        .from('queue_items')
        .select('media_type, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (packagesError) throw packagesError;

      const totalPackages = packages?.length || 0;
      const packagesByType = packages?.reduce((acc, pkg) => {
        if (pkg.media_type === 'image') acc.photo++;
        if (pkg.media_type === 'video') acc.video++;
        return acc;
      }, { photo: 0, video: 0 }) || { photo: 0, video: 0 };

      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('total_purchases, first_purchase_at, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (customersError) throw customersError;

      const newCustomers = customers?.filter(c => c.total_purchases === 1).length || 0;
      const returningCustomers = customers?.filter(c => c.total_purchases > 1).length || 0;

      setMetrics({
        totalRevenue,
        processingRevenue,
        completedRevenue,
        totalPackages,
        newCustomers,
        returningCustomers,
        packagesByType
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Métricas del Negocio</h2>
          <p className="text-sm text-muted-foreground">
            Vista general de ingresos, paquetes y clientes
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={(value: DateRange) => setDateRange(value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="year">Este Año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "PPP") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "PPP") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(metrics.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completados: {formatCurrency(metrics.completedRevenue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Procesando: {formatCurrency(metrics.processingRevenue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Paquetes</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalPackages}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fotos: {metrics.packagesByType.photo}
                </p>
                <p className="text-xs text-muted-foreground">
                  Videos: {metrics.packagesByType.video}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nuevos Clientes</CardTitle>
                <UserPlus className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.newCustomers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Primera compra en el periodo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Frecuentes</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.returningCustomers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Compras repetidas
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Desglose de Ingresos
                </CardTitle>
                <CardDescription>
                  Estado de los pagos en el periodo seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm">Completados</span>
                    </div>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(metrics.completedRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm">Procesando</span>
                    </div>
                    <span className="font-bold text-yellow-600">
                      {formatCurrency(metrics.processingRevenue)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold text-lg">
                        {formatCurrency(metrics.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Segmentación de Clientes
                </CardTitle>
                <CardDescription>
                  Distribución de clientes nuevos vs. frecuentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-purple-600" />
                      <span className="text-sm">Nuevos</span>
                    </div>
                    <span className="font-bold text-purple-600 text-lg">
                      {metrics.newCustomers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-orange-600" />
                      <span className="text-sm">Frecuentes</span>
                    </div>
                    <span className="font-bold text-orange-600 text-lg">
                      {metrics.returningCustomers}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Total Clientes</span>
                      <span className="font-bold text-lg">
                        {metrics.newCustomers + metrics.returningCustomers}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

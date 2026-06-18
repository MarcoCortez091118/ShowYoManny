import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, Package, Users, UserPlus, Calendar as CalendarIcon, TrendingUp } from "lucide-react";
import { format, subDays, subMonths, subYears, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type DateRange = 'day' | 'week' | 'month' | 'year' | 'custom';

interface MetricsData {
  totalRevenue: number;
  processingRevenue: number;
  completedRevenue: number;
  totalPackages: number;
  newCustomers: number;
  returningCustomers: number;
  packagesByType: { photo: number; video: number };
}

interface ChartDataPoint {
  label: string;
  revenue: number;
  packages: number;
}

const CHART_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DashboardMetrics() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [metrics, setMetrics] = useState<MetricsData>({
    totalRevenue: 0, processingRevenue: 0, completedRevenue: 0,
    totalPackages: 0, newCustomers: 0, returningCustomers: 0,
    packagesByType: { photo: 0, video: 0 }
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRangeFilter = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (dateRange) {
      case 'day': startDate = startOfDay(now); break;
      case 'week': startDate = startOfDay(subDays(now, 7)); break;
      case 'month': startDate = startOfDay(subMonths(now, 1)); break;
      case 'year': startDate = startOfDay(subYears(now, 1)); break;
      case 'custom':
        if (!customStartDate || !customEndDate) return null;
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default: startDate = startOfDay(subDays(now, 7));
    }

    return { startDate, endDate };
  };

  const buildChartData = (orders: any[], packages: any[], startDate: Date, endDate: Date) => {
    let intervals: Date[];
    let labelFormat: string;

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) {
      intervals = [startDate];
      labelFormat = 'HH:mm';
    } else if (daysDiff <= 14) {
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
      labelFormat = 'dd MMM';
    } else if (daysDiff <= 90) {
      intervals = eachWeekOfInterval({ start: startDate, end: endDate });
      labelFormat = 'dd MMM';
    } else {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      labelFormat = 'MMM yyyy';
    }

    const data: ChartDataPoint[] = intervals.map((intervalStart, idx) => {
      const intervalEnd = idx < intervals.length - 1
        ? intervals[idx + 1]
        : endDate;

      const intervalOrders = orders?.filter(o => {
        const d = new Date(o.created_at);
        return d >= intervalStart && d < intervalEnd;
      }) || [];

      const intervalPackages = packages?.filter(p => {
        const d = new Date(p.created_at);
        return d >= intervalStart && d < intervalEnd;
      }) || [];

      const revenue = intervalOrders.reduce((sum: number, o: any) => sum + (Number(o.amount_total) / 100), 0);

      return {
        label: format(intervalStart, labelFormat, { locale: es }),
        revenue,
        packages: intervalPackages.length,
      };
    });

    return data;
  };

  const fetchMetrics = async () => {
    const dateFilter = getDateRangeFilter();
    if (!dateFilter) return;

    setLoading(true);

    try {
      const { startDate, endDate } = dateFilter;

      const [ordersRes, packagesRes] = await Promise.all([
        supabase
          .from('stripe_orders')
          .select('amount_total, payment_status, status, customer_id, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase
          .from('queue_items')
          .select('media_type, created_at')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
      ]);

      const orders = ordersRes.data || [];
      const packages = packagesRes.data || [];

      const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.amount_total) / 100), 0);
      const completedRevenue = orders.filter(o => o.status === 'completed' || o.payment_status === 'paid').reduce((sum, o) => sum + (Number(o.amount_total) / 100), 0);
      const processingRevenue = orders.filter(o => o.status === 'pending' || o.payment_status === 'unpaid').reduce((sum, o) => sum + (Number(o.amount_total) / 100), 0);

      const totalPackages = packages.length;
      const packagesByType = packages.reduce((acc, pkg) => {
        if (pkg.media_type === 'image') acc.photo++;
        if (pkg.media_type === 'video') acc.video++;
        return acc;
      }, { photo: 0, video: 0 });

      const uniqueCustomerIds = new Set(orders.map(o => o.customer_id).filter(Boolean));
      let newCustomers = 0;
      let returningCustomers = 0;

      if (uniqueCustomerIds.size > 0) {
        const { data: allOrdersForCustomers } = await supabase
          .from('stripe_orders')
          .select('customer_id, created_at')
          .in('customer_id', Array.from(uniqueCustomerIds))
          .order('created_at', { ascending: true });

        if (allOrdersForCustomers) {
          const customerFirstOrder: Record<string, string> = {};
          for (const order of allOrdersForCustomers) {
            if (!order.customer_id) continue;
            if (!customerFirstOrder[order.customer_id]) {
              customerFirstOrder[order.customer_id] = order.created_at;
            }
          }
          for (const customerId of uniqueCustomerIds) {
            const firstOrderDate = customerFirstOrder[customerId];
            if (firstOrderDate && new Date(firstOrderDate) >= startDate) {
              newCustomers++;
            } else {
              returningCustomers++;
            }
          }
        }
      }

      setMetrics({ totalRevenue, processingRevenue, completedRevenue, totalPackages, newCustomers, returningCustomers, packagesByType });
      setChartData(buildChartData(orders, packages, startDate, endDate));
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [dateRange, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(amount);

  const pieData = [
    { name: 'Fotos', value: metrics.packagesByType.photo },
    { name: 'Videos', value: metrics.packagesByType.video },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Resumen del Periodo</h2>
        <div className="flex gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={(v: DateRange) => setDateRange(v)}>
            <SelectTrigger className="w-[150px] bg-white border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Ultimos 7 dias</SelectItem>
              <SelectItem value="month">Ultimo mes</SelectItem>
              <SelectItem value="year">Ultimo ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === 'custom' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[130px] justify-start text-left font-normal text-sm">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {customStartDate ? format(customStartDate, "dd/MM/yy") : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customStartDate} onSelect={setCustomStartDate} initialFocus />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[130px] justify-start text-left font-normal text-sm">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {customEndDate ? format(customEndDate, "dd/MM/yy") : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customEndDate} onSelect={setCustomEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 animate-pulse">
              <div className="h-4 w-24 bg-gray-100 rounded mb-3" />
              <div className="h-8 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ingresos</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">
                {formatCurrency(metrics.completedRevenue)} confirmados
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paquetes</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalPackages}</p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.packagesByType.photo} fotos, {metrics.packagesByType.video} videos
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nuevos</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-sky-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.newCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">Clientes nuevos</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recurrentes</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.returningCustomers}</p>
              <p className="text-xs text-gray-500 mt-1">Clientes frecuentes</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2 border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Ingresos en el Periodo</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
                    No hay datos para este periodo
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Packages Chart */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Paquetes por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2">
                      {pieData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx] }} />
                          <span className="text-xs text-gray-600">{entry.name} ({entry.value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
                    Sin paquetes en este periodo
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Packages Timeline */}
          {chartData.length > 1 && (
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">Paquetes Subidos por Periodo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      formatter={(value: number) => [value, 'Paquetes']}
                    />
                    <Bar dataKey="packages" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

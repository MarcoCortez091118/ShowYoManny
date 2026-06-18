import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Trash2, Clock, Eye, Settings, ChartBar as BarChart3, DollarSign, Sparkles, ChevronLeft, ChevronRight, Upload, CircleCheck as CheckCircle, Circle as XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabaseContentService, QueueItem } from "@/services/supabaseContentService";
import { supabaseBorderThemeService, type BorderTheme as UploadedBorderTheme } from "@/services/supabaseBorderThemeService";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { CustomersTable } from "@/components/CustomersTable";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, user, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [contentQueue, setContentQueue] = useState<QueueItem[]>([]);
  const [contentHistory, setContentHistory] = useState<any[]>([]);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [uploadedBorderThemes, setUploadedBorderThemes] = useState<UploadedBorderTheme[]>([]);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const getUserInitials = () => {
    if (!user?.email) return 'A';
    return user.email.charAt(0).toUpperCase();
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await signOut();
      toast({ title: "Sesion cerrada", description: "Has cerrado sesion correctamente" });
      navigate('/admin-login', { replace: true });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo cerrar sesion", variant: "destructive" });
    } finally {
      setShowLogoutDialog(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchContentQueue();
      fetchContentHistory(historyPage);
    }
  }, [authLoading, isAdmin, historyPage]);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const themes = await supabaseBorderThemeService.getActive();
        setUploadedBorderThemes(themes);
      } catch (error) {
        console.error('Error loading border themes:', error);
      }
    };
    loadThemes();
  }, []);

  const fetchContentQueue = async () => {
    if (!isAdmin) return;
    try {
      setIsQueueLoading(true);
      const queue = await supabaseContentService.fetchQueue();
      setContentQueue(queue);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setIsQueueLoading(false);
    }
  };

  const fetchContentHistory = async (page: number = 0) => {
    if (!isAdmin || !user?.id) return;
    try {
      setIsHistoryLoading(true);
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      const { data, error, count } = await supabase
        .from('content_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setContentHistory(data || []);
      setTotalHistoryCount(count || 0);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Validando sesion...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafb]">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Acceso Restringido</CardTitle>
            <CardDescription>Solo administradores pueden acceder al panel.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" onClick={() => navigate('/')}>Volver al Inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const navItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/admin', active: true },
    { label: 'Queue', icon: Play, path: '/admin/queue' },
    { label: 'Borders', icon: Sparkles, path: '/admin/borders' },
    { label: 'Historial', icon: Clock, path: '/admin/history' },
    { label: 'Logs', icon: BarChart3, path: '/admin/logs' },
    { label: 'Ajustes', icon: Settings, path: '/admin/settings' },
  ];

  const activeCount = contentQueue.filter(item => {
    const now = new Date();
    const hasStarted = !item.scheduled_start || new Date(item.scheduled_start) <= now;
    const notEnded = !item.scheduled_end || new Date(item.scheduled_end) > now;
    return item.status !== 'completed' && hasStarted && notEnded;
  }).length;

  const scheduledCount = contentQueue.filter(item => {
    const now = new Date();
    return item.scheduled_start && new Date(item.scheduled_start) > now;
  }).length;

  return (
    <div className="min-h-screen bg-[#f8fafb] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
            <Eye className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">ShowYo</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 hidden sm:block">Vista general de tu negocio</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/admin/queue')}
                className="hidden sm:flex gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir Contenido
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/settings')}
                className="hidden sm:flex gap-2 border-gray-200"
              >
                <Settings className="h-4 w-4" />
                Ajustes
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 lg:hidden">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Admin</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogoutClick} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl space-y-8">
          {/* Quick Access Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <button
              onClick={() => navigate('/admin/queue')}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100 hover:shadow-md hover:shadow-blue-100/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Queue</p>
                <p className="text-lg font-bold text-gray-900">{contentQueue.length}</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/borders')}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-100 hover:shadow-md hover:shadow-amber-100/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Borders</p>
                <p className="text-lg font-bold text-gray-900">{uploadedBorderThemes.length}</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/history')}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 hover:shadow-md hover:shadow-emerald-100/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Historial</p>
                <p className="text-lg font-bold text-gray-900">{totalHistoryCount}</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/logs')}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-100 hover:shadow-md hover:shadow-rose-100/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-rose-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Logs</p>
                <p className="text-lg font-bold text-gray-900">Ver</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/billing')}
              className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-100 hover:shadow-md hover:shadow-cyan-100/50 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Billing</p>
                <p className="text-lg font-bold text-gray-900">Ver</p>
              </div>
            </button>
          </div>

          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Total</span>
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{contentQueue.length + totalHistoryCount}</p>
              <p className="text-xs text-gray-500 mt-1">Elementos procesados</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Activos</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Play className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
              <p className="text-xs text-gray-500 mt-1">Reproduciendose ahora</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Programados</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
              <p className="text-xs text-gray-500 mt-1">Pendientes de publicar</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-600">Eliminados</span>
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{contentHistory.filter(item => item.deleted_at).length}</p>
              <p className="text-xs text-gray-500 mt-1">Del sistema</p>
            </div>
          </div>

          {/* Metrics with Charts */}
          <DashboardMetrics />

          {/* Customers */}
          <CustomersTable />

          {/* Recent History */}
          <Card className="border-gray-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Historial Reciente</CardTitle>
                  <CardDescription>Ultimos elementos procesados</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/history')}>
                  Ver todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="text-center py-8 text-gray-400">Cargando...</div>
              ) : contentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No hay elementos en el historial</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 uppercase">Nombre</th>
                        <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 uppercase">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 uppercase">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-xs text-gray-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contentHistory.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {item.title || 'Sin titulo'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              {item.media_type === 'video' ? 'Video' : 'Imagen'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={item.deleted_at ? "destructive" : "secondary"} className="text-xs">
                              {item.deleted_at ? 'Eliminado' : 'Completado'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalHistoryCount > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {historyPage * ITEMS_PER_PAGE + 1} - {Math.min((historyPage + 1) * ITEMS_PER_PAGE, totalHistoryCount)} de {totalHistoryCount}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.max(0, p - 1))} disabled={historyPage === 0}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-gray-500">
                      {historyPage + 1} / {Math.ceil(totalHistoryCount / ITEMS_PER_PAGE)}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => p + 1)} disabled={(historyPage + 1) * ITEMS_PER_PAGE >= totalHistoryCount}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar sesion</AlertDialogTitle>
            <AlertDialogDescription>
              Seras redirigido a la pagina de login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cerrar sesion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;

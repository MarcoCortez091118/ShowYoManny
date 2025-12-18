import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfToday } from "date-fns";
import { ContentScheduler } from "@/components/ContentScheduler";
import { DraggableQueueItem } from "@/components/DraggableQueueItem";
import { BorderPreview } from "@/components/BorderPreview";
import PreviewModal from "@/components/PreviewModal";
import { AdminMediaEditor, AdminMediaEditorRef } from "@/components/media/AdminMediaEditor";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { CustomersTable } from "@/components/CustomersTable";
import {
  Upload,
  Play,
  Pause,
  SkipForward,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings,
  BarChart3,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  Edit,
  Repeat,
  CheckCircle2,
  Sparkles,
  GripVertical,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading, user, signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [contentQueue, setContentQueue] = useState<QueueItem[]>([]);
  const [pendingOrders, setPendingOrders] = useState<QueueItem[]>([]);
  const [contentHistory, setContentHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [borderStyle, setBorderStyle] = useState("none");
  const [displayDuration, setDisplayDuration] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<QueueItem | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showUploadReaction, setShowUploadReaction] = useState(false);
  const [processedMediaMetadata, setProcessedMediaMetadata] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaEditorRef = useRef<AdminMediaEditorRef>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalHistoryCount, setTotalHistoryCount] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Scheduling options
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledStartDate, setScheduledStartDate] = useState<Date | undefined>();
  const [scheduledStartTime, setScheduledStartTime] = useState("09:00");
  const [scheduledEndDate, setScheduledEndDate] = useState<Date | undefined>();
  const [scheduledEndTime, setScheduledEndTime] = useState("17:00");
  
  // Timer loop options
  const [timerLoopEnabled, setTimerLoopEnabled] = useState(false);
  const [timerLoopMinutes, setTimerLoopMinutes] = useState(30);
  const [timerLoopAutomatic, setTimerLoopAutomatic] = useState(false);
  const [uploadedBorderThemes, setUploadedBorderThemes] = useState<UploadedBorderTheme[]>([]);

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
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
      navigate('/admin-login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowLogoutDialog(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchContentQueue();
      fetchPendingOrders();
      fetchContentHistory(historyPage);
    }
  }, [authLoading, isAdmin, historyPage]);

  useEffect(() => {
    const loadUploadedBorderThemes = async () => {
      try {
        const themes = await supabaseBorderThemeService.getActive();
        setUploadedBorderThemes(themes);
      } catch (error) {
        console.error('Error loading uploaded border themes:', error);
      }
    };

    loadUploadedBorderThemes();
  }, []);

  const fetchContentQueue = async () => {
    if (!isAdmin) {
      setIsQueueLoading(false);
      return;
    }

    try {
      setIsQueueLoading(true);
      const queue = await supabaseContentService.fetchQueue();
      setContentQueue(queue);
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content queue",
        variant: "destructive",
      });
    } finally {
      setIsQueueLoading(false);
    }
  };

  const fetchContentHistory = async (page: number = 0) => {
    if (!isAdmin || !user?.id) {
      setIsHistoryLoading(false);
      return;
    }

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

  const fetchPendingOrders = async () => {
    if (!isAdmin) {
      setIsPendingLoading(false);
      return;
    }

    // Temporarily disabled - migrating to Supabase
    console.log('⚠️ fetchPendingOrders disabled - migrating to Supabase');
    setIsPendingLoading(false);
    setPendingOrders([]);
  };

  const handleAdminUpload = async () => {
    console.log('🚀 =====================================');
    console.log('🚀 handleAdminUpload - USING SUPABASE');
    console.log('🚀 NOT using Firebase Functions');
    console.log('🚀 =====================================');

    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    console.log('📁 File:', selectedFile.name, '|', selectedFile.type, '|', selectedFile.size, 'bytes');
    setIsLoading(true);
    setIsUploading(true);
    setUploadProgress(0);

    // Real progress tracking from Supabase

    try {
      const getScheduledDateTime = (date: Date | undefined, time: string) => {
        if (!date) return null;
        const [hours, minutes] = time.split(':').map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined.toISOString();
      };

      const scheduled_start = isScheduled ? getScheduledDateTime(scheduledStartDate, scheduledStartTime) : null;
      const scheduled_end = isScheduled ? getScheduledDateTime(scheduledEndDate, scheduledEndTime) : null;

      console.log('📤 Calling supabaseContentService.createQueueItem...');
      await supabaseContentService.createQueueItem({
        file: selectedFile,
        borderStyle: borderStyle,
        duration: displayDuration,
        scheduledStart: scheduled_start,
        scheduledEnd: scheduled_end,
        timerLoopEnabled,
        timerLoopMinutes: timerLoopEnabled && !timerLoopAutomatic ? timerLoopMinutes : null,
        timerLoopAutomatic,
        metadata: processedMediaMetadata,
        onProgress: (progress) => {
          console.log(`📊 Upload progress: ${progress}%`);
          setUploadProgress(progress);
        },
      });

      setShowUploadReaction(true);
      setTimeout(() => setShowUploadReaction(false), 3000);

      toast({
        title: "🎉 Content Uploaded Successfully!",
        description: `${isScheduled ? 'Scheduled' : 'Immediate'} upload complete${timerLoopEnabled ? ' with timer loop enabled' : ''}`,
      });

      // Reset all form fields
      setSelectedFile(null);
      setIsScheduled(false);
      setScheduledStartDate(undefined);
      setScheduledStartTime("09:00");
      setScheduledEndDate(undefined);
      setScheduledEndTime("17:00");
      setTimerLoopEnabled(false);
      setTimerLoopMinutes(30);
      setTimerLoopAutomatic(false);
      setBorderStyle("none");
      setDisplayDuration(10);
      setProcessedMediaMetadata(null);

      // Reset media editor
      mediaEditorRef.current?.reset();

      fetchContentQueue();

      // Reset upload progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload content",
        variant: "destructive",
      });
      setUploadProgress(0);
      setIsUploading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = (order: QueueItem) => {
    setSelectedOrder(order);
    setIsSchedulerOpen(true);
  };

  const handleScheduleSave = async (scheduleData: any) => {
    if (!selectedOrder) return;

    try {
      await firebaseOrderService.updateOrder(selectedOrder.id, {
        ...scheduleData,
      });

      toast({
        title: "Schedule Updated",
        description: "Content schedule saved successfully",
      });

      fetchContentQueue();
    } catch (error) {
      console.error('Schedule update error:', error);
      toast({
        title: "Schedule Failed",
        description: "Failed to update content schedule",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (order: OrderRecord | null) => {
    console.log('handlePreview called with order:', order);
    console.log('Order ID:', order?.id);

    if (!order || !order.id) {
      toast({
        title: "Preview Error",
        description: "Cannot preview: Order data is missing",
        variant: "destructive",
      });
      return;
    }
    
    setPreviewOrderId(order.id);
    setIsPreviewOpen(true);
  };

  const extractVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) {
        resolve(10); // Default for non-video files
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        resolve(duration > 0 ? duration : 10);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(10); // Fallback to default
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setDisplayDuration(10);
      return;
    }

    // Check file size limits
    const maxSize = 5 * 1024 * 1024 * 1024; // 5 GB
    const size1GB = 1024 * 1024 * 1024; // 1 GB
    const size500MB = 500 * 1024 * 1024; // 500 MB
    const size100MB = 100 * 1024 * 1024; // 100 MB

    if (file.size > maxSize) {
      const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      toast({
        title: "File Too Large",
        description: `File size (${sizeGB} GB) exceeds maximum allowed (5 GB). Please use a smaller file.`,
        variant: "destructive",
      });
      return;
    }

    // Progressive warnings based on file size
    if (file.size > size1GB) {
      const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
      toast({
        title: "Very Large File",
        description: `File size is ${sizeGB} GB. Upload will take significant time. Ensure stable connection.`,
        variant: "default",
        duration: 6000,
      });
    } else if (file.size > size500MB) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(0);
      toast({
        title: "Large File Warning",
        description: `File size is ${sizeMB} MB. Upload may take several minutes.`,
        variant: "default",
      });
    } else if (file.size > size100MB) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(0);
      toast({
        title: "File Upload Info",
        description: `File size is ${sizeMB} MB. Upload may take some time.`,
        variant: "default",
      });
    }

    setSelectedFile(file);

    // Extract video duration automatically
    const duration = await extractVideoDuration(file);
    setDisplayDuration(duration);

    if (file.type.startsWith('video/')) {
      toast({
        title: "Video Duration Detected",
        description: `Automatically set to ${duration} seconds`,
      });
    }
  };

  const handleDeleteContent = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      const queueItem = contentQueue.find((item) => item.order?.id === orderId);
      const filePath = queueItem?.order?.file_path;

      await firebaseQueueService.removeOrder(orderId);
      await firebaseOrderService.deleteOrder(orderId);

      if (filePath) {
        await firebaseStorageService.deleteAsset(filePath);
      }

      toast({
        title: "Content Deleted",
        description: "Content removed successfully",
      });

      fetchContentQueue();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete content",
        variant: "destructive",
      });
    }
  };

  const moderateContent = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      await firebaseOrderService.updateOrder(orderId, {
        moderation_status: action === 'approve' ? 'approved' : 'rejected',
        display_status: action === 'approve' ? 'queued' : 'rejected',
      });

      if (action === 'approve') {
        await firebaseQueueService.enqueueOrder({ orderId });
      } else {
        await firebaseQueueService.removeOrder(orderId).catch(() => undefined);
      }

      toast({
        title: "Content Moderated",
        description: `Content ${action}d successfully`,
      });

      fetchContentQueue();
      fetchPendingOrders();
    } catch (error) {
      console.error('Moderation error:', error);
      toast({
        title: "Moderation Failed",
        description: "Failed to moderate content",
        variant: "destructive",
      });
    }
  };

  const controlPlayback = async (action: 'play' | 'pause' | 'next') => {
    try {
      // Update the current active content based on action
      if (action === 'next') {
        const activeItem = contentQueue.find(item => item.is_active && item.order);
        if (activeItem?.order) {
          await firebaseOrderService.updateOrder(activeItem.order.id, {
            display_status: 'completed',
          });
          await firebaseQueueService.removeOrder(activeItem.order.id).catch(() => undefined);
        }
      }

      toast({
        title: "Playback Control",
        description: `${action} command sent`,
      });

      fetchContentQueue();
    } catch (error) {
      console.error('Playback control error:', error);
      toast({
        title: "Control Failed",
        description: "Failed to control playback",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = contentQueue.findIndex((item) => item.id === active.id);
    const newIndex = contentQueue.findIndex((item) => item.id === over.id);

    // Optimistically update UI
    const reordered = arrayMove(contentQueue, oldIndex, newIndex).map((item, index) => ({
      ...item,
      queue_position: index + 1,
    }));

    setContentQueue(reordered);

    try {
      await firebaseQueueService.updateQueueOrder({
        queue: reordered.map((item) => ({
          id: item.id,
          queue_position: item.queue_position,
        })),
      });

      toast({
        title: "Queue Updated",
        description: "Playlist order saved successfully",
      });
    } catch (error) {
      console.error('Queue reorder error:', error);
      fetchContentQueue();
      toast({
        title: "Update Failed",
        description: "Failed to save queue order",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        Validating admin session...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>Only administrators can manage the billboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-3 sm:p-4 md:p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Admin Dashboard
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground">
                Manage content, moderate uploads, and control the digital billboard
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate('/admin/settings')}
                className="shrink-0"
              >
                <Settings className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Admin Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogoutClick} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/queue')}
            className="h-auto py-4 flex-col gap-2"
          >
            <Play className="h-5 w-5" />
            <span>Queue Manager</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/borders')}
            className="h-auto py-4 flex-col gap-2"
          >
            <Sparkles className="h-5 w-5" />
            <span>Border Themes</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/logs')}
            className="h-auto py-4 flex-col gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Activity Logs</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/history')}
            className="h-auto py-4 flex-col gap-2"
          >
            <Clock className="h-5 w-5" />
            <span>Content History</span>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm touch-target">Overview</TabsTrigger>
            <TabsTrigger value="content" className="text-xs sm:text-sm touch-target">Content</TabsTrigger>
            <TabsTrigger value="moderate" className="text-xs sm:text-sm touch-target">Moderate</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <DashboardMetrics />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reproducidos</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {contentQueue.length + contentHistory.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Elementos totales
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Activos</CardTitle>
                    <Play className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {contentQueue.filter(item => {
                        const now = new Date();
                        const hasStarted = !item.scheduled_start || new Date(item.scheduled_start) <= now;
                        const notEnded = !item.scheduled_end || new Date(item.scheduled_end) > now;
                        return item.status !== 'completed' && hasStarted && notEnded;
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Reproduciéndose ahora
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Programados</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {contentQueue.filter(item => {
                        const now = new Date();
                        return item.scheduled_start && new Date(item.scheduled_start) > now;
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pendientes de publicar
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Borrados</CardTitle>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {contentHistory.filter(item => item.deleted_at).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Eliminados del sistema
                    </p>
                  </CardContent>
                </Card>
              </div>

              <CustomersTable />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Historial de Contenido
                  </CardTitle>
                  <CardDescription>
                    Registro de todos los elementos que han pasado por el sistema
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isHistoryLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Cargando historial...
                    </div>
                  ) : contentHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay elementos en el historial
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-medium text-sm">Nombre</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Tipo</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Fecha Inicio</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Hora Inicio</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Fecha Fin</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Hora Fin</th>
                            <th className="text-left py-3 px-4 font-medium text-sm">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contentHistory.map((item) => (
                            <tr key={`history-${item.id}`} className="border-b hover:bg-muted/50">
                              <td className="py-3 px-4 text-sm">
                                {item.title || 'Sin título'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <Badge variant="outline">
                                  {item.media_type === 'video' ? '🎥 Video' : '🖼️ Imagen'}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {item.scheduled_start
                                  ? new Date(item.scheduled_start).toLocaleDateString('es-ES')
                                  : item.created_at
                                  ? new Date(item.created_at).toLocaleDateString('es-ES')
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {item.scheduled_start
                                  ? new Date(item.scheduled_start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                  : item.created_at
                                  ? new Date(item.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {item.scheduled_end
                                  ? new Date(item.scheduled_end).toLocaleDateString('es-ES')
                                  : item.deleted_at
                                  ? new Date(item.deleted_at).toLocaleDateString('es-ES')
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm text-muted-foreground">
                                {item.scheduled_end
                                  ? new Date(item.scheduled_end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                  : item.deleted_at
                                  ? new Date(item.deleted_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </td>
                              <td className="py-3 px-4 text-sm">
                                <Badge variant="destructive">Eliminado</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  {totalHistoryCount > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {historyPage * ITEMS_PER_PAGE + 1} - {Math.min((historyPage + 1) * ITEMS_PER_PAGE, totalHistoryCount)} de {totalHistoryCount} registros
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(prev => Math.max(0, prev - 1))}
                          disabled={historyPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Página {historyPage + 1} de {Math.ceil(totalHistoryCount / ITEMS_PER_PAGE)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryPage(prev => prev + 1)}
                          disabled={(historyPage + 1) * ITEMS_PER_PAGE >= totalHistoryCount}
                        >
                          Siguiente
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <AdminMediaEditor
              ref={mediaEditorRef}
              onFileProcessed={(file, metadata) => {
                setSelectedFile(file);
                setProcessedMediaMetadata(metadata);
                if (metadata.duration) {
                  setDisplayDuration(Math.round(metadata.duration));
                }
              }}
            />

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Configuración de Contenido
                </CardTitle>
                <CardDescription>
                  Configura el estilo de borde, duración y opciones de programación. Tamaño máximo: 5 GB (recomendado: &lt;100 MB para mejor rendimiento)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedFile && processedMediaMetadata && (
                  <div className="p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {processedMediaMetadata.width}x{processedMediaMetadata.height}px
                          {processedMediaMetadata.duration && ` • ${processedMediaMetadata.duration.toFixed(1)}s`}
                          {' • '}{selectedFile.size >= 1024 * 1024 * 1024
                            ? `${(selectedFile.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
                            : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`}
                        </p>
                        {selectedFile.size > 1024 * 1024 * 1024 && (
                          <p className="text-xs text-red-600 mt-1 font-medium">
                            ⚠️ Very large file - upload will take significant time
                          </p>
                        )}
                        {selectedFile.size > 500 * 1024 * 1024 && selectedFile.size <= 1024 * 1024 * 1024 && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ Large file - upload may take several minutes
                          </p>
                        )}
                        {selectedFile.size > 100 * 1024 * 1024 && selectedFile.size <= 500 * 1024 * 1024 && (
                          <p className="text-xs text-yellow-600 mt-1">
                            ℹ️ Upload may take some time
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">{selectedFile.type.startsWith('video/') ? 'Video' : 'Imagen'}</Badge>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="admin-border">Border Style</Label>
                  <div className="space-y-4 mt-4 max-h-80 overflow-y-auto">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                        BASE
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => setBorderStyle("none")}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            borderStyle === "none"
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Sin Borde</span>
                            {borderStyle === "none" && (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Contenido sin marco decorativo
                          </p>
                        </button>
                      </div>
                    </div>

                    {uploadedBorderThemes.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          CUSTOM BORDERS
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {uploadedBorderThemes.map((theme) => (
                            <div
                              key={theme.id}
                              onClick={() => setBorderStyle(theme.id)}
                              className={`cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-xl ${
                                borderStyle === theme.id
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xl'
                                  : 'border-border hover:border-primary/60 hover:bg-primary/5'
                              }`}
                            >
                              <div className="p-2">
                                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                  <img
                                    src={theme.image_url}
                                    alt={theme.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                              <div className="px-3 pb-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-semibold text-sm">{theme.name}</h4>
                                  {borderStyle === theme.id && (
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                                {theme.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {uploadedBorderThemes.length > 0
                      ? "Selecciona un borde personalizado o mantén 'Sin Borde' para contenido sin marco"
                      : "No hay borders personalizados. Ve a la sección 'Borders' para subir algunos."}
                  </p>
                </div>

                <div>
                  <Label htmlFor="admin-duration">Display Duration (seconds)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="admin-duration"
                      type="number"
                      min="1"
                      value={displayDuration}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1) {
                          setDisplayDuration(value);
                        }
                      }}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground mt-2">
                      {selectedFile?.type.startsWith('video/') ? '(Auto-detected)' : '(Manual)'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFile?.type.startsWith('video/')
                      ? 'Duración del video detectada. Puedes ajustarla si lo necesitas.'
                      : 'Establece cuánto tiempo se mostrará este contenido (mínimo 1 segundo).'}
                  </p>
                </div>

                {/* Scheduling Options */}
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="schedule-mode"
                        checked={isScheduled}
                        onCheckedChange={setIsScheduled}
                      />
                      <Label htmlFor="schedule-mode" className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Schedule Content
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-10">
                      Programa este contenido para que se muestre automáticamente en un período específico
                    </p>
                  </div>

                  {isScheduled && (
                    <div className="space-y-6 p-4 bg-muted/50 rounded-lg">
                      {/* Start Date & Time */}
                      <div>
                        <Label className="text-sm font-medium">Start Date & Time</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledStartDate ? format(scheduledStartDate, "PPP") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={scheduledStartDate}
                                onSelect={setScheduledStartDate}
                                initialFocus
                                className="pointer-events-auto"
                                disabled={(date) => date < startOfToday()}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <div>
                            <Input
                              type="time"
                              value={scheduledStartTime}
                              onChange={(e) => setScheduledStartTime(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* End Date & Time */}
                      <div>
                        <Label className="text-sm font-medium">End Date & Time (Optional)</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledEndDate ? format(scheduledEndDate, "PPP") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={scheduledEndDate}
                                onSelect={setScheduledEndDate}
                                initialFocus
                                className="pointer-events-auto"
                                disabled={(date) => date < startOfToday()}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <div>
                            <Input
                              type="time"
                              value={scheduledEndTime}
                              onChange={(e) => setScheduledEndTime(e.target.value)}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timer Loop Options */}
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="timer-loop"
                        checked={timerLoopEnabled}
                        onCheckedChange={setTimerLoopEnabled}
                      />
                      <Label htmlFor="timer-loop" className="flex items-center gap-2">
                        <Repeat className="h-4 w-4" />
                        Enable Timer Loop
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-10">
                      Repite este contenido automáticamente cada X minutos según su posición en la cola
                    </p>
                  </div>

                  {timerLoopEnabled && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="timer-automatic"
                            checked={timerLoopAutomatic}
                            onCheckedChange={(checked) => {
                              setTimerLoopAutomatic(checked);
                              if (checked) {
                                setTimerLoopMinutes(0);
                              } else {
                                setTimerLoopMinutes(30);
                              }
                            }}
                          />
                          <Label htmlFor="timer-automatic" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Timer Automático
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground pl-10">
                          El sistema calcula automáticamente el intervalo basándose en la duración total de la cola y la posición del contenido
                        </p>
                      </div>

                      {!timerLoopAutomatic && (
                        <div>
                          <Label htmlFor="timer-interval">Intervalo Manual (minutos)</Label>
                          <Input
                            id="timer-interval"
                            type="number"
                            min="1"
                            max="1440"
                            value={timerLoopMinutes}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (value >= 1 && value <= 1440) {
                                setTimerLoopMinutes(value);
                              }
                            }}
                            placeholder="Ej: 30, 45, 90..."
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Define el intervalo en minutos (1-1440). El contenido se repetirá después de este tiempo.
                          </p>
                        </div>
                      )}

                      {timerLoopAutomatic && (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div className="text-xs">
                              <p className="font-medium text-primary mb-1">Cálculo Inteligente Activado</p>
                              <p className="text-muted-foreground">
                                El sistema distribuirá este contenido de forma óptima basándose en:
                              </p>
                              <ul className="list-disc list-inside mt-1 space-y-0.5 text-muted-foreground">
                                <li>Duración total de todos los items en la cola</li>
                                <li>Posición de este contenido</li>
                                <li>Tiempo de reproducción de otros items</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedFile && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <h4 className="font-semibold text-primary mb-3">Resumen de Configuración</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Archivo:</span>
                            <p className="font-medium truncate">{selectedFile.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Borde:</span>
                            <p className="font-medium">{borderStyle === "none" ? "Sin borde" : borderStyle}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duración:</span>
                            <p className="font-medium">{displayDuration}s</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Programado:</span>
                            <p className="font-medium">{isScheduled ? "Sí" : "No"}</p>
                          </div>
                          {timerLoopEnabled && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Timer Loop:</span>
                              <p className="font-medium">
                                {timerLoopAutomatic
                                  ? "Automático (calculado por el sistema)"
                                  : `Cada ${timerLoopMinutes} minutos`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Live Preview with Border */}
                {selectedFile && processedMediaMetadata && (
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Vista Previa con Borde
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative aspect-[2048/2432] w-full max-w-md mx-auto bg-black rounded-lg overflow-hidden">
                        {/* Media Content */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {selectedFile.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Preview"
                              className="w-full h-full object-contain"
                              style={{
                                transform: `translate(${(processedMediaMetadata.positionX || 50) - 50}%, ${(processedMediaMetadata.positionY || 50) - 50}%) scale(${(processedMediaMetadata.zoom || 100) / 100}) rotate(${processedMediaMetadata.rotation || 0}deg)`,
                              }}
                            />
                          ) : (
                            <video
                              src={URL.createObjectURL(selectedFile)}
                              className="w-full h-full object-contain"
                              autoPlay
                              muted
                              loop
                              style={{
                                transform: `translate(${(processedMediaMetadata.positionX || 50) - 50}%, ${(processedMediaMetadata.positionY || 50) - 50}%) scale(${(processedMediaMetadata.zoom || 100) / 100}) rotate(${processedMediaMetadata.rotation || 0}deg)`,
                              }}
                            />
                          )}
                        </div>

                        {/* Border Overlay */}
                        {borderStyle !== "none" && (() => {
                          const uploadedBorder = uploadedBorderThemes.find(b => b.id === borderStyle);
                          if (uploadedBorder) {
                            return (
                              <div className="absolute inset-0 pointer-events-none z-10">
                                <img
                                  src={uploadedBorder.image_url}
                                  alt={uploadedBorder.name}
                                  className="w-full h-full object-fill"
                                  style={{ mixBlendMode: 'normal' }}
                                />
                              </div>
                            );
                          }

                          return null;
                        })()}
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-3">
                        Así se verá tu contenido en el kiosk {borderStyle !== "none" ? `con el borde "${borderStyle}"` : "sin borde"}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subiendo archivo...</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      {uploadProgress < 30 && "Preparando archivo..."}
                      {uploadProgress >= 30 && uploadProgress < 60 && "Subiendo a servidor..."}
                      {uploadProgress >= 60 && uploadProgress < 90 && "Procesando..."}
                      {uploadProgress >= 90 && uploadProgress < 100 && "Finalizando..."}
                      {uploadProgress === 100 && "¡Completado!"}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleAdminUpload}
                  disabled={!selectedFile || isLoading}
                  variant="electric"
                  size="lg"
                  className="w-full relative"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Subiendo a la base de datos...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Content a la DB
                      {isScheduled && <CalendarIcon className="h-4 w-4" />}
                      {timerLoopEnabled && <Repeat className="h-4 w-4" />}
                    </span>
                  )}
                </Button>

                {/* Upload Success Reaction */}
                {showUploadReaction && (
                  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-2xl animate-scale-in">
                      <div className="flex items-center gap-3 text-lg font-bold">
                        <CheckCircle2 className="h-8 w-8" />
                        <span>Upload Successful!</span>
                        <Sparkles className="h-8 w-8 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderate">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Content Moderation
                </CardTitle>
                <CardDescription>
                  Review and moderate uploaded content from paid customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isPendingLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading pending submissions...
                    </div>
                  ) : pendingOrders.length > 0 ? (
                    pendingOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg border-warning bg-warning/5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{order.file_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Uploaded by: {order.user_email}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moderateContent(order.id, 'approve')}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moderateContent(order.id, 'reject')}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No content pending moderation
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Content Scheduler Modal */}
        <ContentScheduler
          order={selectedOrder}
          isOpen={isSchedulerOpen}
          onClose={() => setIsSchedulerOpen(false)}
          onSave={handleScheduleSave}
        />


        {/* Preview Modal */}
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          orderId={previewOrderId || ''}
        />

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro que deseas cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription>
                Serás redirigido a la página de inicio de sesión y tendrás que volver a ingresar tus credenciales.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogoutConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Cerrar sesión
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
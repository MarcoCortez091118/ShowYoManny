import React, { useState, useEffect, useMemo } from 'react';
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
import { AdminMediaEditor } from "@/components/media/AdminMediaEditor";
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
  GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { borderService } from "@/domain/services/borderService";
import { supabaseContentService, QueueItem } from "@/services/supabaseContentService";
import { useAuth } from "@/contexts/SimpleAuthContext";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(true);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [borderStyle, setBorderStyle] = useState("none");
  const [displayDuration, setDisplayDuration] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<QueueItem | null>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showUploadReaction, setShowUploadReaction] = useState(false);
  const [processedMediaMetadata, setProcessedMediaMetadata] = useState<any>(null);
  
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
  
  const borderThemes = useMemo(() => borderService.getAll(), []);
  const borderCategories = useMemo(() => borderService.getCategories(), []);
  const borderCategoryLabels = useMemo(
    () => ({
      Holiday: "🎄 Holiday Borders",
      "Special Occasions": "🎓 Special Occasions",
      Futuristic: "🚀 Futuristic Borders",
      Seasonal: "🌤️ Seasonal Borders",
    }),
    []
  );

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
    }
  }, [authLoading, isAdmin]);

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
      });

      setShowUploadReaction(true);
      setTimeout(() => setShowUploadReaction(false), 3000);

      toast({
        title: "🎉 Content Uploaded Successfully!",
        description: `${isScheduled ? 'Scheduled' : 'Immediate'} upload complete${timerLoopEnabled ? ' with timer loop enabled' : ''}`,
      });

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

      fetchContentQueue();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload content",
        variant: "destructive",
      });
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm touch-target">Overview</TabsTrigger>
            <TabsTrigger value="content" className="text-xs sm:text-sm touch-target">Content</TabsTrigger>
            <TabsTrigger value="queue" className="text-xs sm:text-sm touch-target">Queue</TabsTrigger>
            <TabsTrigger value="moderate" className="text-xs sm:text-sm touch-target">Moderate</TabsTrigger>
            <TabsTrigger value="controls" className="text-xs sm:text-sm touch-target">Controls</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Queue Items</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{contentQueue.length}</div>
                    <p className="text-xs text-muted-foreground">
                      +{contentQueue.filter(item => !item.is_active).length} waiting in queue
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Content</CardTitle>
                    <Play className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {contentQueue.filter(item => item.is_active).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently displaying
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$0</div>
                    <p className="text-xs text-muted-foreground">
                      Total earnings
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <AdminMediaEditor
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
                  Configura el estilo de borde, duración y opciones de programación
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
                        </p>
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
                          onClick={() => setBorderStyle(borderStyle === "none" ? "" : "none")}
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

                    {borderCategories.map((category) => {
                      const categoryBorders = borderThemes.filter(border => border.category === category);
                      if (categoryBorders.length === 0) return null;

                      return (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            {borderCategoryLabels[category] ?? category}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryBorders.map((border) => (
                              <BorderPreview
                                key={border.id}
                                border={border}
                                isSelected={borderStyle === border.id}
                                onClick={() => setBorderStyle(borderStyle === border.id ? "none" : border.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click nuevamente en un borde seleccionado para deseleccionarlo
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
                          <Select value={timerLoopMinutes.toString()} onValueChange={(value) => setTimerLoopMinutes(parseInt(value))}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutos</SelectItem>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="60">1 hora</SelectItem>
                              <SelectItem value="120">2 horas</SelectItem>
                              <SelectItem value="180">3 horas</SelectItem>
                              <SelectItem value="240">4 horas</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">El contenido se repetirá después de este intervalo</p>
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
                              className="max-w-full max-h-full object-contain"
                              style={{
                                transform: `scale(${(processedMediaMetadata.zoom || 100) / 100}) rotate(${processedMediaMetadata.rotation || 0}deg)`,
                                objectPosition: `${processedMediaMetadata.positionX || 50}% ${processedMediaMetadata.positionY || 50}%`,
                              }}
                            />
                          ) : (
                            <video
                              src={URL.createObjectURL(selectedFile)}
                              className="max-w-full max-h-full object-contain"
                              autoPlay
                              muted
                              loop
                              style={{
                                transform: `scale(${(processedMediaMetadata.zoom || 100) / 100}) rotate(${processedMediaMetadata.rotation || 0}deg)`,
                                objectPosition: `${processedMediaMetadata.positionX || 50}% ${processedMediaMetadata.positionY || 50}%`,
                              }}
                            />
                          )}
                        </div>

                        {/* Border Overlay */}
                        {borderStyle !== "none" && (() => {
                          const selectedBorder = borderThemes.find(b => b.id === borderStyle);
                          if (!selectedBorder) return null;

                          return (
                            <div className="absolute inset-0 pointer-events-none z-10">
                              {/* Top Banner */}
                              {selectedBorder.message && (
                                <div className="absolute inset-x-0 top-0 py-3 bg-gradient-to-b from-black/90 via-black/80 to-transparent text-white flex items-center justify-center">
                                  <div className="text-lg font-bold tracking-wide drop-shadow-lg">
                                    {selectedBorder.message}
                                  </div>
                                </div>
                              )}

                              {/* Bottom Banner */}
                              {selectedBorder.message && (
                                <div className="absolute inset-x-0 bottom-0 py-3 bg-gradient-to-t from-black/90 via-black/80 to-transparent text-white flex items-center justify-center">
                                  <div className="text-lg font-bold tracking-wide drop-shadow-lg">
                                    {selectedBorder.message}
                                  </div>
                                </div>
                              )}

                              {/* Corner Decorations */}
                              {selectedBorder.category === 'Holiday' && (
                                <>
                                  <div className="absolute top-4 left-4 text-4xl drop-shadow-xl">🎄</div>
                                  <div className="absolute top-4 right-4 text-4xl drop-shadow-xl">🎄</div>
                                  <div className="absolute bottom-4 left-4 text-4xl drop-shadow-xl">🎁</div>
                                  <div className="absolute bottom-4 right-4 text-4xl drop-shadow-xl">⭐</div>
                                </>
                              )}

                              {selectedBorder.category === 'Special Occasions' && (
                                <>
                                  <div className="absolute top-4 left-4 text-4xl drop-shadow-xl">✨</div>
                                  <div className="absolute top-4 right-4 text-4xl drop-shadow-xl">✨</div>
                                  <div className="absolute bottom-4 left-4 text-4xl drop-shadow-xl">🎉</div>
                                  <div className="absolute bottom-4 right-4 text-4xl drop-shadow-xl">🎊</div>
                                </>
                              )}

                              {selectedBorder.category === 'Futuristic' && (
                                <>
                                  <div className="absolute top-4 left-4 text-3xl drop-shadow-xl">⚡</div>
                                  <div className="absolute top-4 right-4 text-3xl drop-shadow-xl">⚡</div>
                                  <div className="absolute bottom-4 left-4 text-3xl drop-shadow-xl">🔮</div>
                                  <div className="absolute bottom-4 right-4 text-3xl drop-shadow-xl">🔮</div>
                                </>
                              )}

                              {selectedBorder.category === 'Seasonal' && (
                                <>
                                  <div className="absolute top-4 left-4 text-4xl drop-shadow-xl">
                                    {selectedBorder.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
                                  </div>
                                  <div className="absolute top-4 right-4 text-4xl drop-shadow-xl">
                                    {selectedBorder.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
                                  </div>
                                  <div className="absolute bottom-4 left-4 text-4xl drop-shadow-xl">
                                    {selectedBorder.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
                                  </div>
                                  <div className="absolute bottom-4 right-4 text-4xl drop-shadow-xl">
                                    {selectedBorder.name.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '✨'}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-center text-muted-foreground mt-3">
                        Así se verá tu contenido en el kiosk {borderStyle !== "none" ? `con el borde "${borderStyle}"` : "sin borde"}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Button
                  onClick={handleAdminUpload}
                  disabled={!selectedFile || isLoading}
                  variant="electric"
                  size="lg"
                  className="w-full relative"
                >
                  {isLoading ? (
                    "Subiendo a la base de datos..."
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

          <TabsContent value="queue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Content Queue
                </CardTitle>
                <CardDescription>
                  View and manage the content display queue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <GripVertical className="h-4 w-4" />
                    Drag and drop items to reorder the playlist
                  </p>
                </div>

                {isQueueLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading queue...</div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={contentQueue.map(item => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {contentQueue.map((item, index) => (
                          <DraggableQueueItem
                            key={item.id}
                            item={item}
                            order={item.order}
                            index={index}
                            onEdit={(order) => {
                              setSelectedOrder(order);
                              setBorderStyle(order.border_id || 'none');
                              setDisplayDuration(order.duration_seconds || 10);
                              setIsScheduled(!!order.scheduled_start);
                              if (order.scheduled_start) {
                                const startDate = new Date(order.scheduled_start);
                                setScheduledStartDate(startDate);
                                setScheduledStartTime(format(startDate, 'HH:mm'));
                              }
                              if (order.scheduled_end) {
                                const endDate = new Date(order.scheduled_end);
                                setScheduledEndDate(endDate);
                                setScheduledEndTime(format(endDate, 'HH:mm'));
                              }
                              setTimerLoopEnabled(order.timer_loop_enabled || false);
                              setTimerLoopMinutes(order.timer_loop_minutes || 30);
                              setIsSchedulerOpen(true);
                            }}
                            onPreview={handlePreview}
                            onDelete={handleDeleteContent}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {!isQueueLoading && contentQueue.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No content in queue
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

          <TabsContent value="controls">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Player Controls
                </CardTitle>
                <CardDescription>
                  Control the digital billboard display
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 justify-center py-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => controlPlayback('play')}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Play
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => controlPlayback('pause')}
                  >
                    <Pause className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => controlPlayback('next')}
                  >
                    <SkipForward className="h-5 w-5 mr-2" />
                    Next
                  </Button>
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
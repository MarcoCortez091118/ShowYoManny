import React, { useState, useEffect } from 'react';
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
import LiveKioskPreview from "@/components/LiveKioskPreview";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
  const [contentQueue, setContentQueue] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [borderStyle, setBorderStyle] = useState("none");
  const [displayDuration, setDisplayDuration] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showUploadReaction, setShowUploadReaction] = useState(false);
  
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
  
  const borderOptions = [
    // 🎄 Holiday Borders
    { 
      id: "merry-christmas", 
      name: "🎄 Merry Christmas",
      category: "Holiday",
      preview: "border-4 border-red-600 bg-gradient-to-r from-red-100 via-green-100 to-red-100",
      description: "Festive Christmas celebration",
      message: "Merry Christmas"
    },
    { 
      id: "happy-new-year", 
      name: "🎊 Happy New Year",
      category: "Holiday",
      preview: "border-4 border-yellow-500 bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100",
      description: "New Year celebration",
      message: "Happy New Year"
    },
    { 
      id: "happy-valentines", 
      name: "💝 Happy Valentine's Day",
      category: "Holiday",
      preview: "border-4 border-pink-500 bg-gradient-to-r from-pink-100 via-red-100 to-pink-100",
      description: "Love and romance celebration",
      message: "Happy Valentine's Day"
    },
    { 
      id: "happy-halloween", 
      name: "🎃 Happy Halloween",
      category: "Holiday",
      preview: "border-4 border-orange-600 bg-gradient-to-r from-orange-100 via-black/10 to-orange-100",
      description: "Spooky Halloween fun",
      message: "Happy Halloween"
    },
    { 
      id: "happy-easter", 
      name: "🐰 Happy Easter",
      category: "Holiday",
      preview: "border-4 border-purple-500 bg-gradient-to-r from-purple-100 via-yellow-100 to-purple-100",
      description: "Easter celebration",
      message: "Happy Easter"
    },
    { 
      id: "happy-thanksgiving", 
      name: "🦃 Happy Thanksgiving",
      category: "Holiday",
      preview: "border-4 border-amber-600 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100",
      description: "Thanksgiving gratitude",
      message: "Happy Thanksgiving"
    },
    // 🎓 Special Occasions
    { 
      id: "happy-birthday", 
      name: "🎂 Happy Birthday",
      category: "Special Occasions",
      preview: "border-4 border-blue-500 bg-gradient-to-r from-blue-100 via-pink-100 to-blue-100",
      description: "Birthday celebration",
      message: "Happy Birthday"
    },
    { 
      id: "congrats-graduate", 
      name: "🎓 Congrats Graduate",
      category: "Special Occasions",
      preview: "border-4 border-indigo-600 bg-gradient-to-r from-indigo-100 via-yellow-100 to-indigo-100",
      description: "Graduation achievement",
      message: "Congrats Graduate"
    },
    { 
      id: "happy-anniversary", 
      name: "💍 Happy Anniversary",
      category: "Special Occasions",
      preview: "border-4 border-rose-500 bg-gradient-to-r from-rose-100 via-gold-100 to-rose-100",
      description: "Anniversary celebration",
      message: "Happy Anniversary"
    },
    { 
      id: "wedding-day", 
      name: "👰 Wedding Day",
      category: "Special Occasions",
      preview: "border-4 border-white bg-gradient-to-r from-white via-pink-50 to-white",
      description: "Wedding celebration",
      message: "Wedding Day"
    },
    // 🚀 Futuristic Borders
    { 
      id: "neon-glow", 
      name: "🌐 Neon Glow",
      category: "Futuristic",
      preview: "border-4 border-cyan-400 bg-gradient-to-r from-cyan-100 via-purple-100 to-cyan-100",
      description: "Neon glow effects",
      message: "Neon Glow"
    },
    { 
      id: "tech-circuit", 
      name: "⚡ Tech Circuit",
      category: "Futuristic",
      preview: "border-4 border-blue-600 bg-gradient-to-r from-blue-100 via-cyan-100 to-blue-100",
      description: "Tech circuit pattern",
      message: "Tech Circuit"
    },
    { 
      id: "galaxy", 
      name: "🌌 Galaxy",
      category: "Futuristic",
      preview: "border-4 border-indigo-600 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100",
      description: "Stars and space",
      message: "Galaxy"
    },
    { 
      id: "cyberpunk", 
      name: "💠 Cyberpunk",
      category: "Futuristic",
      preview: "border-4 border-fuchsia-500 bg-gradient-to-r from-fuchsia-100 via-cyan-100 to-fuchsia-100",
      description: "Cyberpunk neon grid",
      message: "Cyberpunk"
    },
    // 🌤️ Seasonal Borders
    { 
      id: "summer", 
      name: "☀️ Summer",
      category: "Seasonal",
      preview: "border-4 border-yellow-400 bg-gradient-to-r from-yellow-100 via-orange-100 to-yellow-100",
      description: "Summer vibes",
      message: "Summer"
    },
    { 
      id: "winter", 
      name: "❄️ Winter",
      category: "Seasonal",
      preview: "border-4 border-blue-300 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50",
      description: "Winter wonderland",
      message: "Winter"
    },
    { 
      id: "autumn", 
      name: "🍂 Autumn",
      category: "Seasonal",
      preview: "border-4 border-orange-500 bg-gradient-to-r from-orange-100 via-red-100 to-orange-100",
      description: "Fall leaves",
      message: "Autumn"
    },
  ];

  useEffect(() => {
    fetchContentQueue();
    fetchPendingOrders();
  }, []);

  const fetchContentQueue = async () => {
    try {
      const { data, error } = await supabase.functions
        .invoke('content-upload', {
          body: { action: 'get_queue' }
        });

      if (error) throw error;
      setContentQueue(data.queue || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast({
        title: "Error",
        description: "Failed to fetch content queue",
        variant: "destructive",
      });
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('moderation_status', 'pending')
        .eq('is_admin_content', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingOrders(data || []);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending orders",
        variant: "destructive",
      });
    }
  };

  const handleAdminUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `admin-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `content/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('billboard-content')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create admin order with scheduling and repeat options
      // Combine date and time for scheduling
      const getScheduledDateTime = (date: Date | undefined, time: string) => {
        if (!date) return null;
        const [hours, minutes] = time.split(':').map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined.toISOString();
      };

      const scheduled_start = isScheduled ? getScheduledDateTime(scheduledStartDate, scheduledStartTime) : null;
      const scheduled_end = isScheduled ? getScheduledDateTime(scheduledEndDate, scheduledEndTime) : null;

      const { error: orderError } = await supabase.functions
        .invoke('content-upload', {
          body: {
            action: 'create_order',
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            filePath: filePath,
            borderStyle,
            displayDuration,
            scheduled_start,
            scheduled_end,
            timer_loop_enabled: timerLoopEnabled,
            timer_loop_minutes: timerLoopEnabled ? timerLoopMinutes : null,
            userEmail: 'admin@showyo.app' // Admin uploads
          }
        });

      if (orderError) throw orderError;

      // Show upload reaction
      setShowUploadReaction(true);
      setTimeout(() => setShowUploadReaction(false), 3000);

      toast({
        title: "🎉 Content Uploaded Successfully!",
        description: `${isScheduled ? 'Scheduled' : 'Immediate'} upload complete${timerLoopEnabled ? ' with timer loop enabled' : ''}`,
      });

      // Reset form
      setSelectedFile(null);
      setIsScheduled(false);
      setScheduledStartDate(undefined);
      setScheduledStartTime("09:00");
      setScheduledEndDate(undefined);
      setScheduledEndTime("17:00");
      setTimerLoopEnabled(false);
      setTimerLoopMinutes(30);
      setBorderStyle("none");
      setDisplayDuration(10);
      
      fetchContentQueue();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = (order: any) => {
    setSelectedOrder(order);
    setIsSchedulerOpen(true);
  };

  const handleScheduleSave = async (scheduleData: any) => {
    if (!selectedOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          ...scheduleData,
          is_admin_content: true
        })
        .eq('id', selectedOrder.id);

      if (error) throw error;

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

  const handlePreview = (order: any) => {
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
      // Delete from content_queue first
      await supabase
        .from('content_queue')
        .delete()
        .eq('order_id', orderId);

      // Then delete from orders
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

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
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          moderation_status: action === 'approve' ? 'approved' : 'rejected',
          display_status: action === 'approve' ? 'queued' : 'rejected'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // If approved, add to content queue
      if (action === 'approve') {
        // Get next queue position
        const { data: queueData } = await supabase
          .from('content_queue')
          .select('queue_position')
          .order('queue_position', { ascending: false })
          .limit(1);

        const nextPosition = queueData && queueData.length > 0 ? queueData[0].queue_position + 1 : 1;

        // Add to queue
        const { error: queueError } = await supabase
          .from('content_queue')
          .insert({
            order_id: orderId,
            queue_position: nextPosition,
            is_active: false
          });

        if (queueError) throw queueError;
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
        const activeItem = contentQueue.find(item => item.is_active);
        if (activeItem) {
          await supabase
            .from('orders')
            .update({ display_status: 'completed' })
            .eq('id', activeItem.order_id);
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
    const newQueue = arrayMove(contentQueue, oldIndex, newIndex);
    setContentQueue(newQueue);

    try {
      // Update all queue positions in database
      const updates = newQueue.map((item, index) => 
        supabase
          .from('content_queue')
          .update({ queue_position: index + 1 })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      toast({
        title: "Queue Updated",
        description: "Playlist order saved successfully",
      });
    } catch (error) {
      console.error('Queue reorder error:', error);
      // Revert on error
      fetchContentQueue();
      toast({
        title: "Update Failed",
        description: "Failed to save queue order",
        variant: "destructive",
      });
    }
  };

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
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate('/admin/settings')}
              className="shrink-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
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

              {/* Live Kiosk Preview */}
              <LiveKioskPreview />
            </div>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Admin Content Upload
                </CardTitle>
                <CardDescription>
                  Upload content directly as admin (bypasses payment and moderation)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="admin-file">Select File</Label>
                  <Input
                    id="admin-file"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedFile.name} • {selectedFile.type.startsWith('video/') ? `${displayDuration}s` : 'Image'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="admin-border">Border Style</Label>
                  <div className="space-y-4 mt-4 max-h-80 overflow-y-auto">
                    {["Basic", "Holiday", "Special Occasions", "Futuristic", "Seasonal"].map((category) => {
                      const categoryBorders = borderOptions.filter(border => border.category === category);
                      if (categoryBorders.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">{category}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryBorders.map((border) => (
                              <BorderPreview
                                key={border.id}
                                border={border}
                                isSelected={borderStyle === border.id}
                                onClick={() => setBorderStyle(border.id)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="admin-duration">Display Duration (seconds)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="admin-duration"
                      type="number"
                      min="1"
                      max="300"
                      value={displayDuration}
                      onChange={(e) => setDisplayDuration(parseInt(e.target.value) || 10)}
                      className="mt-2"
                    />
                    <span className="text-sm text-muted-foreground mt-2">
                      {selectedFile?.type.startsWith('video/') ? '(Auto-detected)' : '(Manual)'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedFile?.type.startsWith('video/') 
                      ? 'Video duration detected automatically. You can adjust if needed.' 
                      : 'Set how long this content should display.'}
                  </p>
                </div>

                {/* Scheduling Options */}
                <Separator />
                <div className="space-y-4">
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
                  
                  {timerLoopEnabled && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label htmlFor="timer-interval">Loop Interval (minutes)</Label>
                      <Select value={timerLoopMinutes.toString()} onValueChange={(value) => setTimerLoopMinutes(parseInt(value))}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-2">Content will repeat after this interval</p>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={handleAdminUpload}
                  disabled={!selectedFile || isLoading}
                  variant="electric"
                  className="w-full relative"
                >
                  {isLoading ? (
                    "Uploading..."
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Content
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
                
                {contentQueue.length === 0 && (
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
                  {pendingOrders.map((order) => (
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
                  ))}
                  
                  {pendingOrders.length === 0 && (
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
      </div>
    </div>
  );
};

export default AdminDashboard;
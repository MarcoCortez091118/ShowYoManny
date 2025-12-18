import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, GripVertical, Play, Trash2, Calendar, Clock, CreditCard as Edit, CircleCheck as CheckCircle2, Clock as ClockIcon, Circle as XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabaseQueueService, type EnrichedQueueItem } from "@/services/supabaseQueueService";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { KioskSimulator } from "@/components/KioskSimulator";
import type { Database } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type QueueItem = EnrichedQueueItem;

const SortableItem = ({
  item,
  onDelete,
  onEdit
}: {
  item: QueueItem;
  onDelete: (item: QueueItem) => void;
  onEdit: (item: QueueItem) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'expired': return 'bg-red-500';
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (item: QueueItem) => {
    if (item.computed_status === 'scheduled') {
      const start = new Date(item.scheduled_start!);
      return `Scheduled (${start.toLocaleString()})`;
    }
    if (item.computed_status === 'published' && item.expires_in_minutes !== undefined) {
      return `Published (expires in ${item.expires_in_minutes}m)`;
    }
    if (item.computed_status === 'expired') {
      return 'Expired (auto-delete pending)';
    }
    return item.computed_status;
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 mb-2">
      <div className="w-full overflow-x-auto overflow-y-visible pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center gap-4 min-w-max">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing flex-shrink-0">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>

          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            {item.media_type === 'image' ? (
              <img
                src={item.media_url}
                alt={item.title || 'Preview'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <video
                src={item.media_url}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
            )}
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${getStatusColor(item.computed_status)} flex-shrink-0`}>
                {getStatusLabel(item)}
              </Badge>
              {!item.is_visible && (
                <Badge variant="outline" className="text-xs flex-shrink-0">
                  Hidden from Display
                </Badge>
              )}
              {item.metadata?.is_user_paid_content && (
                <Badge variant="default" className="bg-purple-600 text-xs flex-shrink-0">
                  💳 Paid {item.metadata?.slot_type === 'immediate' ? '(Slot 1)' : `(Slot ${item.metadata?.auto_scheduled_slot || '?'})`}
                </Badge>
              )}
              <span className="font-medium whitespace-nowrap">
                {item.title || 'Untitled'}
              </span>
            </div>

            <div className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Play className="w-3 h-3" />
                {item.duration}s • {item.media_type}
              </span>
              {item.scheduled_start && (
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.scheduled_start).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item)}
              title="Editar item"
              className="h-9 w-9"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(item)}
              title="Eliminar item"
              className="h-9 w-9 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, isAdmin, user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<QueueItem | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<QueueItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    scheduled_start: '',
    scheduled_end: '',
    duration: 0,
  });
  const fetchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isFetchingQueue = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const debouncedFetchQueue = () => {
    if (fetchDebounceTimer.current) {
      clearTimeout(fetchDebounceTimer.current);
    }
    fetchDebounceTimer.current = setTimeout(() => {
      if (!isFetchingQueue.current) {
        fetchQueue();
      }
    }, 300);
  };

  const recalculateStatuses = () => {
    setItems(currentItems => {
      return currentItems.map(item => {
        const now = new Date();
        const scheduledStart = item.scheduled_start ? new Date(item.scheduled_start) : null;
        const scheduledEnd = item.scheduled_end ? new Date(item.scheduled_end) : null;

        let computed_status = item.computed_status;
        let is_visible = item.is_visible;
        let expires_in_minutes = item.expires_in_minutes;

        if (scheduledEnd && now > scheduledEnd) {
          computed_status = 'expired';
          is_visible = false;
        } else if (scheduledStart && now < scheduledStart) {
          computed_status = 'scheduled';
          is_visible = false;
        } else if (scheduledStart && now >= scheduledStart) {
          computed_status = 'published';
          is_visible = true;
          expires_in_minutes = scheduledEnd ? Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60)) : undefined;
        }

        return {
          ...item,
          computed_status,
          is_visible,
          expires_in_minutes,
        };
      });
    });
  };

  useEffect(() => {
    if (!loading && isAdmin && user?.id) {
      const userId = user.id;
      fetchQueue();

      const channel = supabase
        .channel('queue_items_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'queue_items',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('AdminQueue: Realtime change detected', payload);
            debouncedFetchQueue();
          }
        )
        .subscribe();

      const statusUpdateInterval = setInterval(() => {
        console.log('AdminQueue: Recalculating status badges...');
        recalculateStatuses();
      }, 10000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(statusUpdateInterval);
      };
    }
  }, [loading, isAdmin, user?.id]);

  const fetchQueue = async () => {
    if (!user?.id) return;
    if (isFetchingQueue.current) {
      console.log('AdminQueue: Fetch already in progress, skipping...');
      return;
    }

    isFetchingQueue.current = true;
    try {
      setIsFetching(true);
      console.log(`[AdminQueue] fetchQueue - user.id: ${user.id}, isAdmin: ${isAdmin}`);
      // Pasar isAdmin=true para que admins vean TODO el contenido
      const data = await supabaseQueueService.getQueueItems(user.id, isAdmin);
      console.log(`[AdminQueue] Received ${data.length} items`);
      const scheduledItems = data.filter(i => i.computed_status === 'scheduled');
      console.log(`[AdminQueue] Scheduled items count: ${scheduledItems.length}`, scheduledItems);
      setItems(data);
    } catch (error: any) {
      toast({ title: "Error loading queue", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
      isFetchingQueue.current = false;
    }
  };

  const handleDragEnd = async (event: any) => {
    if (!user?.id) return;

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    try {
      await supabaseQueueService.reorderQueueItems(
        user.id,
        reordered.map((item) => item.id)
      );

      toast({ title: "Queue updated", description: "Order saved successfully" });
    } catch (error: any) {
      console.error('Queue reorder error:', error);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      fetchQueue();
    }
  };

  const handleDeleteClick = (item: QueueItem) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await supabaseQueueService.deleteQueueItem(itemToDelete.id);
      toast({
        title: "Item eliminado",
        description: `"${itemToDelete.title}" fue eliminado exitosamente.`
      });
      fetchQueue();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleEditClick = (item: QueueItem) => {
    setItemToEdit(item);

    const formatDatetimeLocal = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setEditFormData({
      scheduled_start: formatDatetimeLocal(item.scheduled_start),
      scheduled_end: formatDatetimeLocal(item.scheduled_end),
      duration: item.duration || 0,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!itemToEdit) return;

    try {
      const parseLocalDatetime = (localDatetime: string) => {
        if (!localDatetime) return null;
        return new Date(localDatetime).toISOString();
      };

      await supabaseQueueService.updateQueueItem(itemToEdit.id, {
        scheduled_start: parseLocalDatetime(editFormData.scheduled_start),
        scheduled_end: parseLocalDatetime(editFormData.scheduled_end),
        duration: editFormData.duration,
      });

      toast({
        title: "Item actualizado",
        description: "Los cambios se guardaron exitosamente."
      });
      fetchQueue();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setEditDialogOpen(false);
      setItemToEdit(null);
    }
  };

  if (loading || isFetching) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Restricted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need administrative privileges to manage the content queue.
            </p>
            <Button variant="ghost" className="mt-4" onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Queue Management */}
          <Card>
            <CardHeader>
              <CardTitle>Content Queue</CardTitle>
              <p className="text-sm text-muted-foreground">
                Drag items to reorder. Changes save automatically.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="published" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger
                    value="published"
                    className="text-xs sm:text-sm data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  >
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Publicados ({items.filter(i => i.computed_status === 'published' || i.computed_status === 'active').length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="scheduled"
                    className="text-xs sm:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                  >
                    <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Programados ({items.filter(i => i.computed_status === 'scheduled').length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="expired"
                    className="text-xs sm:text-sm data-[state=active]:bg-red-500 data-[state=active]:text-white"
                  >
                    <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Expirados ({items.filter(i => i.computed_status === 'expired' || i.computed_status === 'completed').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="published">
                  {items.filter(i => i.computed_status === 'published' || i.computed_status === 'active').length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay contenido publicado
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.filter(i => i.computed_status === 'published' || i.computed_status === 'active').map(i => i.id)} strategy={verticalListSortingStrategy}>
                          {items.filter(i => i.computed_status === 'published' || i.computed_status === 'active').map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              onDelete={handleDeleteClick}
                              onEdit={handleEditClick}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="scheduled">
                  {items.filter(i => i.computed_status === 'scheduled').length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay contenido programado
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={items.filter(i => i.computed_status === 'scheduled').map(i => i.id)} strategy={verticalListSortingStrategy}>
                          {items.filter(i => i.computed_status === 'scheduled').map((item) => (
                            <SortableItem
                              key={item.id}
                              item={item}
                              onDelete={handleDeleteClick}
                              onEdit={handleEditClick}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </ScrollArea>
                  )}
                </TabsContent>

                <TabsContent value="expired">
                  {items.filter(i => i.computed_status === 'expired' || i.computed_status === 'completed').length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No hay contenido expirado
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      {items.filter(i => i.computed_status === 'expired' || i.computed_status === 'completed').map((item) => (
                        <div key={item.id} className="bg-card border rounded-lg p-4 mb-2 opacity-60">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                              {item.media_type === 'image' ? (
                                <img
                                  src={item.media_url}
                                  alt={item.title || 'Preview'}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <video
                                  src={item.media_url}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge className="bg-red-500">
                                  {item.computed_status === 'expired' ? 'Expirado' : 'Completado'}
                                </Badge>
                                <span className="font-medium truncate">{item.title || 'Untitled'}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {item.file_name}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.duration}s
                                </span>
                                {item.scheduled_end && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Finalizó: {new Date(item.scheduled_end).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(item)}
                              className="h-9 w-9 flex-shrink-0 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Kiosk Simulator */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <KioskSimulator queueItems={items.filter(item => item.is_visible)} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar "{itemToDelete?.title || 'este item'}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Modifica la duración, fecha de inicio o fecha de fin del contenido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (segundos)</Label>
              <Input
                id="duration"
                type="number"
                value={editFormData.duration}
                onChange={(e) => setEditFormData({ ...editFormData, duration: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_start">Fecha y Hora de Inicio (Opcional)</Label>
              <Input
                id="scheduled_start"
                type="datetime-local"
                value={editFormData.scheduled_start}
                onChange={(e) => setEditFormData({ ...editFormData, scheduled_start: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para publicar inmediatamente
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_end">Fecha y Hora de Fin (Opcional)</Label>
              <Input
                id="scheduled_end"
                type="datetime-local"
                value={editFormData.scheduled_end}
                onChange={(e) => setEditFormData({ ...editFormData, scheduled_end: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deja vacío para que no expire
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminQueue;

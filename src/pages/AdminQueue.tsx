import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GripVertical, Play, Trash2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { firebaseQueueService } from "@/domain/services/firebase/queueService";
import { useAuth } from "@/contexts/AuthContext";

interface QueueItem {
  id: string;
  file_name: string;
  file_type: string;
  display_status: string;
  priority: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  play_count: number;
  max_plays: number;
  repeat_frequency_per_day: number;
  queue_position: number;
}

const SortableItem = ({ item }: { item: QueueItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'paid': return 'bg-green-500';
      case 'admin': return 'bg-blue-500';
      case 'house': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4 mb-2">
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={getPriorityColor(item.priority || 'house')}>{item.priority || 'house'}</Badge>
            <span className="font-medium truncate">{item.file_name}</span>
          </div>
          
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {item.play_count}/{item.max_plays} plays
            </span>
            {item.scheduled_start && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.scheduled_start).toLocaleString()}
              </span>
            )}
            {item.scheduled_end && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ends {new Date(item.scheduled_end).toLocaleString()}
              </span>
            )}
            <span>Repeat: {item.repeat_frequency_per_day}x/day</span>
          </div>
        </div>
        
        <Button variant="ghost" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const AdminQueue = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading, isAdmin } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchQueue();
    }
  }, [loading, isAdmin]);

  const fetchQueue = async () => {
    try {
      setIsFetching(true);
      const data = await firebaseQueueService.fetchQueue();
      const queueItems: QueueItem[] = data.map((item) => ({
        id: item.id,
        file_name: item.order?.file_name ?? 'Unknown',
        file_type: item.order?.file_type ?? 'unknown',
        display_status: item.order?.display_status ?? 'pending',
        priority: item.order?.pricing_option_id && !item.order?.is_admin_content ? 'paid'
          : item.order?.is_admin_content ? 'admin'
          : 'house',
        scheduled_start: item.order?.scheduled_start ?? null,
        scheduled_end: item.order?.scheduled_end ?? null,
        play_count: item.order?.play_count ?? 0,
        max_plays: item.order?.max_plays ?? 0,
        repeat_frequency_per_day: item.order?.repeat_frequency_per_day ?? 0,
        queue_position: item.queue_position,
      }));

      setItems(queueItems);
    } catch (error: any) {
      toast({ title: "Error loading queue", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      queue_position: index + 1,
    }));

    setItems(reordered);

    try {
      await firebaseQueueService.updateQueueOrder({
        queue: reordered.map((item) => ({
          id: item.id,
          queue_position: item.queue_position,
        })),
      });

      toast({ title: "Queue updated", description: "Order saved successfully" });
    } catch (error: any) {
      console.error('Queue reorder error:', error);
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      fetchQueue();
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
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Content Queue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Drag items to reorder. Changes save automatically.
            </p>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No items in queue
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {items.map((item) => (
                    <SortableItem key={item.id} item={item} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminQueue;

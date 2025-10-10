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
import { supabaseQueueService } from "@/services/supabaseQueueService";
import { useAuth } from "@/contexts/SimpleAuthContext";
import type { Database } from "@/lib/supabase";

type QueueItem = Database['public']['Tables']['queue_items']['Row'];

const SortableItem = ({ item }: { item: QueueItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'completed': return 'bg-gray-500';
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
            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
            <span className="font-medium truncate">{item.title || 'Untitled'}</span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" />
              {item.duration}s • {item.media_type}
            </span>
            {item.scheduled_start && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.scheduled_start).toLocaleString()}
              </span>
            )}
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
  const { loading, isAdmin, user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!loading && isAdmin && user?.id) {
      fetchQueue();
    }
  }, [loading, isAdmin, user]);

  const fetchQueue = async () => {
    if (!user?.id) return;

    try {
      setIsFetching(true);
      const data = await supabaseQueueService.getQueueItems(user.id);
      setItems(data);
    } catch (error: any) {
      toast({ title: "Error loading queue", description: error.message, variant: "destructive" });
    } finally {
      setIsFetching(false);
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
          <Button variant="ghost" onClick={() => navigate('/admin')}>
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

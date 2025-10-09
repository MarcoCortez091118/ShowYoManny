import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Settings,
  Eye,
  Trash2
} from "lucide-react";
import { QueueItemRecord } from "@/domain/services/firebase/queueService";
import { OrderRecord } from "@/domain/services/firebase/orderService";

interface DraggableQueueItemProps {
  item: QueueItemRecord;
  order: OrderRecord | undefined;
  index: number;
  onEdit: (order: OrderRecord) => void;
  onPreview: (order: OrderRecord) => void;
  onDelete: (orderId: string) => void;
}

export const DraggableQueueItem: React.FC<DraggableQueueItemProps> = ({
  item,
  order,
  index,
  onEdit,
  onPreview,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!order) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg ${
        item.is_active ? 'border-primary bg-primary/5' : 'border-border'
      } ${isDragging ? 'shadow-lg z-50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <Badge variant={item.is_active ? "default" : "secondary"}>
            {item.is_active ? "Playing" : `#${index + 1}`}
          </Badge>

          <div>
            <p className="font-medium">{order.file_name}</p>
            <p className="text-sm text-muted-foreground">
              {order.file_type} • {order.duration_seconds}s
              {order.timer_loop_enabled && order.timer_loop_minutes && (
                <span> • Every {order.timer_loop_minutes}m</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {order.display_status}
          </Badge>
          {order.scheduled_start && (
            <Badge variant="secondary" className="text-xs">
              {new Date(order.scheduled_start).toLocaleDateString()}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(order)}
            title="Edit Content"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(order)}
            title="Preview Content"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(order.id)}
            title="Delete Content"
            className="hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

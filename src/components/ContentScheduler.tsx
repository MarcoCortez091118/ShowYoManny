import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Repeat, Trash2, Save } from "lucide-react";
import { startOfToday } from "date-fns";

interface ContentSchedulerProps {
  order: {
    id: string;
    file_name: string;
    file_type: string;
    duration_seconds: number;
    scheduled_start?: string;
    scheduled_end?: string;
    auto_delete_after_end?: boolean;
    repeat_frequency_per_day?: number;
    custom_duration_seconds?: number;
    video_duration_seconds?: number;
    timer_loop_enabled?: boolean;
    timer_loop_minutes?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: any) => void;
}

export const ContentScheduler: React.FC<ContentSchedulerProps> = ({ 
  order, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [autoDelete, setAutoDelete] = useState(true);
  const [repeatFrequency, setRepeatFrequency] = useState(1);
  const [customDuration, setCustomDuration] = useState(10);

  // Update state whenever order changes
  useEffect(() => {
    if (order) {
      setScheduledStart(order.scheduled_start ? new Date(order.scheduled_start).toISOString().slice(0, 16) : '');
      setScheduledEnd(order.scheduled_end ? new Date(order.scheduled_end).toISOString().slice(0, 16) : '');
      setAutoDelete(order.auto_delete_after_end ?? true);
      setRepeatFrequency(order.repeat_frequency_per_day ?? 1);
      setCustomDuration(order.custom_duration_seconds ?? order.duration_seconds ?? 10);
    }
  }, [order]);

  // Don't render if order is null
  if (!order) {
    return null;
  }

  const handleSave = () => {
    const scheduleData = {
      scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
      scheduled_end: scheduledEnd ? new Date(scheduledEnd).toISOString() : null,
      auto_delete_after_end: autoDelete,
      repeat_frequency_per_day: repeatFrequency,
      custom_duration_seconds: order.file_type.startsWith('image/') ? customDuration : null,
      // Videos use their natural duration, photos use custom duration
    };
    onSave(scheduleData);
    onClose();
  };

  const isVideo = order.file_type?.startsWith('video/') ?? false;
  const displayDuration = isVideo 
    ? (order.video_duration_seconds ?? 30) 
    : customDuration;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Content: {order.file_name || 'Unknown File'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Duration Control */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Display Duration</Label>
            {isVideo ? (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Video Duration: {order.video_duration_seconds ?? 30} seconds (automatic)
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Photo Display Time</span>
                </div>
                <Select value={customDuration.toString()} onValueChange={(value) => setCustomDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Date & Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
              className="w-full"
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime">End Date & Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={scheduledEnd}
              onChange={(e) => setScheduledEnd(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Auto Delete Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Auto Delete After End</Label>
              <p className="text-xs text-muted-foreground">
                Automatically remove content when schedule ends
              </p>
            </div>
            <Switch
              checked={autoDelete}
              onCheckedChange={setAutoDelete}
            />
          </div>

          {/* Repeat Frequency */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              {order.timer_loop_enabled ? 'Timer Loop Interval' : 'Repeat Frequency Per Day'}
            </Label>
            {order.timer_loop_enabled && order.timer_loop_minutes ? (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Repeats every {order.timer_loop_minutes} minutes
                  </span>
                </div>
              </div>
            ) : (
              <Select value={repeatFrequency.toString()} onValueChange={(value) => setRepeatFrequency(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Once per day</SelectItem>
                  <SelectItem value="2">Twice per day</SelectItem>
                  <SelectItem value="3">3 times per day</SelectItem>
                  <SelectItem value="4">4 times per day</SelectItem>
                  <SelectItem value="6">6 times per day</SelectItem>
                  <SelectItem value="12">12 times per day</SelectItem>
                  <SelectItem value="24">Every hour</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Schedule Summary */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <h4 className="text-sm font-medium">Schedule Summary</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Duration: {displayDuration} seconds</p>
              {order.timer_loop_enabled && order.timer_loop_minutes ? (
                <p>Repeats: Every {order.timer_loop_minutes} minutes</p>
              ) : (
                <p>Repeats: {repeatFrequency} times per day</p>
              )}
              {scheduledStart && <p>Starts: {new Date(scheduledStart).toLocaleString()}</p>}
              {scheduledEnd && <p>Ends: {new Date(scheduledEnd).toLocaleString()}</p>}
              <p>Auto Delete: {autoDelete ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
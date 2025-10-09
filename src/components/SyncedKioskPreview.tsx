import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Monitor, RefreshCw } from "lucide-react";
import { firebaseQueueService, QueueItemRecord } from "@/domain/services/firebase/queueService";
import { firebaseStorageService } from "@/domain/services/firebase/storageService";

interface PreviewItem {
  queue: QueueItemRecord;
  mediaUrl: string | null;
}

const SyncedKioskPreview = () => {
  const [queueItems, setQueueItems] = useState<QueueItemRecord[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [mediaCache, setMediaCache] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeItem = queueItems[previewIndex];

  useEffect(() => {
    let mounted = true;

    const loadQueue = async () => {
      try {
        setRefreshing(true);
        const queue = await firebaseQueueService.fetchQueue();
        if (!mounted) return;
        setQueueItems(queue);
      } catch (error) {
        console.error("SyncedKioskPreview: Failed to load queue", error);
      } finally {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadQueue();
    const interval = setInterval(loadQueue, 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const preloadMedia = async () => {
      const order = activeItem?.order;
      if (!order?.file_path || mediaCache[order.file_path] !== undefined) {
        return;
      }

      try {
        const url = await firebaseStorageService.getPublicUrl(order.file_path);
        setMediaCache((cache) => ({ ...cache, [order.file_path]: url }));
      } catch (error) {
        console.error("SyncedKioskPreview: Failed to resolve media URL", error);
        setMediaCache((cache) => ({ ...cache, [order.file_path]: null }));
      }
    };

    preloadMedia();
  }, [activeItem, mediaCache]);

  const previewItems: PreviewItem[] = useMemo(() => {
    return queueItems.map((item) => ({
      queue: item,
      mediaUrl: item.order?.file_path ? mediaCache[item.order.file_path] ?? null : null,
    }));
  }, [queueItems, mediaCache]);

  const handleNext = () => {
    setPreviewIndex((prev) => (prev + 1) % Math.max(queueItems.length, 1));
  };

  const handlePrev = () => {
    setPreviewIndex((prev) => (prev - 1 + Math.max(queueItems.length, 1)) % Math.max(queueItems.length, 1));
  };

  const currentOrder = activeItem?.order;
  const currentMediaUrl = currentOrder?.file_path ? mediaCache[currentOrder.file_path] ?? null : null;
  const hasMedia = Boolean(currentMediaUrl);

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Live Kiosk Preview
          </CardTitle>
          <p className="text-sm text-muted-foreground">Preview the playlist exactly as the kiosk renders it.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={queueItems.length === 0}>
          Next Preview
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading queue...
            </div>
          ) : currentOrder ? (
            hasMedia ? (
              currentOrder.file_type?.startsWith("video/") ? (
                <video
                  key={currentOrder.id}
                  src={currentMediaUrl ?? undefined}
                  autoPlay
                  muted
                  loop
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  key={currentOrder.id}
                  src={currentMediaUrl ?? undefined}
                  alt={currentOrder.file_name ?? "Queued media"}
                  className="h-full w-full object-cover"
                />
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Monitor className="h-10 w-10" />
                <span>No media preview available</span>
                <span className="text-xs">Order: {currentOrder.file_name || currentOrder.id}</span>
              </div>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No content queued
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrev} disabled={queueItems.length === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={queueItems.length === 0}>
              Next
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPreviewIndex(0);
              setRefreshing(true);
              firebaseQueueService
                .fetchQueue()
                .then((queue) => {
                  setQueueItems(queue);
                })
                .finally(() => setRefreshing(false));
            }}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Playlist</h3>
          <div className="space-y-2">
            {previewItems.length === 0 && !loading && (
              <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                Upload content or approve orders to populate the playlist.
              </div>
            )}

            {previewItems.map(({ queue, mediaUrl }) => (
              <div
                key={queue.id}
                className={`flex items-center justify-between rounded border p-3 transition-colors ${
                  queue.id === activeItem?.id ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={queue.is_active ? "default" : "outline"}>
                      #{queue.queue_position ?? 0}
                    </Badge>
                    <span className="font-medium">{queue.order?.file_name ?? "Untitled"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {queue.order?.user_email ?? "Unknown user"} • {queue.order?.duration_seconds ?? 0}s
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {mediaUrl ? "Preview ready" : "Preview pending"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncedKioskPreview;

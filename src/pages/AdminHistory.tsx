import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, Image, Video, Eye } from "lucide-react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContentHistory = Database['public']['Tables']['content_history']['Row'];

const AdminHistory = () => {
  const navigate = useNavigate();
  const { loading, isAdmin, user } = useAuth();
  const [history, setHistory] = useState<ContentHistory[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentHistory | null>(null);

  useEffect(() => {
    if (!loading && isAdmin && user?.id) {
      fetchHistory();
    }
  }, [loading, isAdmin, user]);

  const fetchHistory = async () => {
    if (!user?.id) return;

    try {
      setIsFetching(true);
      const { data, error } = await supabase
        .from('content_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory(data || []);
    } catch (error: any) {
      console.error('Error loading history:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const getStatusColor = (status: string | null) => {
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

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
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
              You need administrative privileges to view content history.
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

        <Card>
          <CardHeader>
            <CardTitle>Content Upload History</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete record of all uploaded content, including deleted items
            </p>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No content history yet
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                        {item.thumbnail_url ? (
                          item.media_type === 'video' ? (
                            <div className="relative w-full h-full">
                              <video
                                src={item.media_url}
                                className="w-full h-full object-cover"
                                muted
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Video className="w-8 h-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title || 'Content'}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.media_type === 'video' ? (
                              <Video className="w-8 h-8 text-muted-foreground" />
                            ) : (
                              <Image className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-base truncate">
                              {item.title || 'Untitled'}
                            </h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.status_at_deletion && (
                                <Badge className={getStatusColor(item.status_at_deletion)}>
                                  {item.status_at_deletion}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {item.media_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.duration}s
                              </Badge>
                              {item.border_style && item.border_style !== 'none' && (
                                <Badge variant="outline" className="text-xs">
                                  Border: {item.border_style}
                                </Badge>
                              )}
                              {item.deleted_at && (
                                <Badge variant="destructive" className="text-xs">
                                  Deleted
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Uploaded: {formatDate(item.created_at)}</span>
                          </div>
                          {item.scheduled_start && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Start: {formatDate(item.scheduled_start)}</span>
                            </div>
                          )}
                          {item.scheduled_end && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>End: {formatDate(item.scheduled_end)}</span>
                            </div>
                          )}
                          {item.deleted_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Deleted: {formatDate(item.deleted_at)}</span>
                            </div>
                          )}
                        </div>

                        {item.reason && (
                          <p className="text-xs text-muted-foreground italic">
                            Reason: {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedItem?.title || 'Content Preview'}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="relative w-full aspect-[2048/2432] bg-black rounded-lg overflow-hidden">
                {selectedItem.media_type === 'video' ? (
                  <video
                    src={selectedItem.media_url}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={selectedItem.media_url}
                    alt={selectedItem.title || 'Content'}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 font-medium">{selectedItem.media_type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">{selectedItem.duration}s</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Border:</span>
                  <span className="ml-2 font-medium">
                    {selectedItem.border_style === 'none' ? 'None' : selectedItem.border_style}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className="ml-2">
                    <Badge className={getStatusColor(selectedItem.status_at_deletion)}>
                      {selectedItem.status_at_deletion || 'Unknown'}
                    </Badge>
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span className="ml-2 font-medium">{formatDate(selectedItem.created_at)}</span>
                </div>
                {selectedItem.scheduled_start && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Scheduled Start:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.scheduled_start)}</span>
                  </div>
                )}
                {selectedItem.scheduled_end && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Scheduled End:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.scheduled_end)}</span>
                  </div>
                )}
                {selectedItem.published_at && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Published At:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.published_at)}</span>
                  </div>
                )}
                {selectedItem.deleted_at && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Deleted At:</span>
                    <span className="ml-2 font-medium">{formatDate(selectedItem.deleted_at)}</span>
                  </div>
                )}
                {selectedItem.reason && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Deletion Reason:</span>
                    <span className="ml-2 font-medium">{selectedItem.reason}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHistory;

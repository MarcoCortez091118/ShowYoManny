import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  id: string;
  created_at: string;
  order_id: string;
  file_name: string;
  user_email: string;
  completed_at: string;
}

const AdminLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [playlistAge, setPlaylistAge] = useState<string>('');

  useEffect(() => {
    fetchLogs();
    checkPlaylistHealth();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('played_content_history')
      .select('*')
      .order('completed_at', { ascending: false })
      .limit(100);

    if (data) setLogs(data);
  };

  const checkPlaylistHealth = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-playlist`);
      const playlist = await response.json();
      const age = Math.floor((Date.now() - new Date(playlist.generated_at).getTime()) / 1000);
      setPlaylistAge(`${age}s ago`);
    } catch (error) {
      setPlaylistAge('Error checking');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Playlist Age</div>
                  <div className="text-2xl font-bold">{playlistAge}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <Badge variant={playlistAge.includes('Error') ? 'destructive' : 'default'}>
                    {playlistAge.includes('Error') ? 'Error' : 'Healthy'}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Plays Today</div>
                  <div className="text-2xl font-bold">{logs.filter(l => 
                    new Date(l.completed_at).toDateString() === new Date().toDateString()
                  ).length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Play History (Last 100)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{log.file_name}</div>
                      <div className="text-sm text-muted-foreground">{log.user_email}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.completed_at).toLocaleString()}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No play history yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;

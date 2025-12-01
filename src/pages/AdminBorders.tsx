import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BorderPreview } from "@/components/BorderPreview";
import { BorderThemeUploader } from '@/components/BorderThemeUploader';
import { supabaseBorderThemeService, type BorderTheme } from '@/services/supabaseBorderThemeService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const AdminBorders = () => {
  const navigate = useNavigate();
  const [borderThemes, setBorderThemes] = useState<BorderTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<BorderTheme | null>(null);
  const [deletingThemeId, setDeletingThemeId] = useState<string | null>(null);

  useEffect(() => {
    loadBorderThemes();
  }, []);

  const loadBorderThemes = async () => {
    try {
      setLoading(true);
      const themes = await supabaseBorderThemeService.getAll();
      setBorderThemes(themes);
    } catch (error) {
      console.error('Error loading border themes:', error);
      toast.error('Failed to load border themes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (theme: BorderTheme) => {
    setEditingTheme(theme);
    setUploaderOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingThemeId) return;

    try {
      await supabaseBorderThemeService.delete(deletingThemeId);
      toast.success('Border theme deleted successfully');
      loadBorderThemes();
    } catch (error) {
      console.error('Error deleting border theme:', error);
      toast.error('Failed to delete border theme');
    } finally {
      setDeletingThemeId(null);
    }
  };

  const handleToggleActive = async (theme: BorderTheme) => {
    try {
      await supabaseBorderThemeService.toggleActive(theme.id, !theme.is_active);
      toast.success(`Border theme ${theme.is_active ? 'disabled' : 'enabled'}`);
      loadBorderThemes();
    } catch (error) {
      console.error('Error toggling border theme:', error);
      toast.error('Failed to update border theme');
    }
  };

  const handleUploaderClose = () => {
    setUploaderOpen(false);
    setEditingTheme(null);
  };

  const groupedThemes = borderThemes.reduce((acc, theme) => {
    if (!acc[theme.category]) {
      acc[theme.category] = [];
    }
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, BorderTheme[]>);

  const categories = Object.keys(groupedThemes).sort();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button onClick={() => setUploaderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Upload New Border
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Border Themes</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Manage custom PNG border overlays that can be applied to content
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : borderThemes.length === 0 ? (
              <div className="p-12 text-center bg-muted/30 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground mb-4">
                  No border themes yet. Upload your first PNG border overlay to get started.
                </p>
                <Button onClick={() => setUploaderOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Border Theme
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {categories.map((category) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-4">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {groupedThemes[category].map((theme) => (
                        <div
                          key={theme.id}
                          className="relative border rounded-lg p-4 hover:shadow-lg transition-shadow"
                        >
                          <div className="absolute top-2 right-2 z-10">
                            <Badge variant={theme.is_active ? 'default' : 'secondary'}>
                              {theme.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>

                          <div className="aspect-[2048/2432] rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-3">
                            <img
                              src={theme.image_url}
                              alt={theme.name}
                              className="w-full h-full object-contain"
                            />
                          </div>

                          <h4 className="font-semibold mb-1">{theme.name}</h4>
                          {theme.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {theme.description}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(theme)}
                              className="flex-1"
                            >
                              {theme.is_active ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-1" />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 mr-1" />
                                  Enable
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(theme)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeletingThemeId(theme.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BorderThemeUploader
        open={uploaderOpen}
        onClose={handleUploaderClose}
        onSuccess={loadBorderThemes}
        editTheme={editingTheme}
      />

      <AlertDialog open={!!deletingThemeId} onOpenChange={() => setDeletingThemeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Border Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this border theme? This action cannot be undone.
              The border image will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBorders;

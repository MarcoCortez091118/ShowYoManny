import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { supabaseBorderThemeService, type BorderTheme, type CreateBorderThemeData } from '@/services/supabaseBorderThemeService';
import { toast } from 'sonner';

interface BorderThemeUploaderProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTheme?: BorderTheme | null;
}

const CATEGORIES: BorderTheme['category'][] = [
  'Holiday',
  'Special Occasions',
  'Futuristic',
  'Seasonal',
  'Custom',
];

export const BorderThemeUploader = ({
  open,
  onClose,
  onSuccess,
  editTheme,
}: BorderThemeUploaderProps) => {
  const [name, setName] = useState(editTheme?.name || '');
  const [category, setCategory] = useState<BorderTheme['category']>(editTheme?.category || 'Custom');
  const [description, setDescription] = useState(editTheme?.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(editTheme?.image_url || '');
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(editTheme?.image_url || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a border name');
      return;
    }

    if (!editTheme && !imageFile) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editTheme?.image_url || '';

      if (imageFile) {
        imageUrl = await supabaseBorderThemeService.uploadBorderImage(imageFile, 'borders');
      }

      const borderData: CreateBorderThemeData = {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        image_url: imageUrl,
      };

      if (editTheme) {
        await supabaseBorderThemeService.update(editTheme.id, borderData);
        toast.success('Border theme updated successfully');
      } else {
        await supabaseBorderThemeService.create(borderData);
        toast.success('Border theme created successfully');
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving border theme:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save border theme');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCategory('Custom');
    setDescription('');
    setImageFile(null);
    setImagePreview('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTheme ? 'Edit Border Theme' : 'Upload New Border Theme'}
          </DialogTitle>
          <DialogDescription>
            Upload a PNG image with transparent background to use as a border overlay for content.
            Recommended size: 2048x2432px to match screen dimensions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Border Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Christmas Border, Summer Frame"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as BorderTheme['category'])}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this border theme..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Border Image (PNG with transparency)</Label>

              {imagePreview ? (
                <div className="relative border-2 border-dashed rounded-lg p-4">
                  <div className="relative aspect-[2048/2432] max-h-96 overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Border preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="border-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="border-image"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Click to upload border image</p>
                      <p className="text-sm text-muted-foreground">
                        PNG format recommended, max 10MB
                      </p>
                    </div>
                  </label>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-blue-900 mb-1">Tips for best results:</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>Use PNG format with transparent background</li>
                  <li>Recommended resolution: 2048x2432px</li>
                  <li>Keep important elements away from center (where content displays)</li>
                  <li>Test with different content types (photos, videos)</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editTheme ? 'Updating...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {editTheme ? 'Update Border' : 'Create Border'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

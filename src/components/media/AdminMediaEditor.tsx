import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Crop,
  Scissors,
  Eye,
  Download,
  RotateCw,
  Maximize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SCREEN_WIDTH = 2048;
const SCREEN_HEIGHT = 2432;
const PREVIEW_SCALE = 0.15;

interface AdminMediaEditorProps {
  onFileProcessed: (file: File, metadata: MediaMetadata) => void;
}

interface MediaMetadata {
  width: number;
  height: number;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
}

export const AdminMediaEditor = ({ onFileProcessed }: AdminMediaEditorProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Image editing states
  const [imageWidth, setImageWidth] = useState(SCREEN_WIDTH);
  const [imageHeight, setImageHeight] = useState(SCREEN_HEIGHT);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropWidth, setCropWidth] = useState(100);
  const [cropHeight, setCropHeight] = useState(100);

  // Video editing states
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoWidth, setVideoWidth] = useState(SCREEN_WIDTH);
  const [videoHeight, setVideoHeight] = useState(SCREEN_HEIGHT);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      setFileType('image');
      loadImageDimensions(url);
    } else if (file.type.startsWith('video/')) {
      setFileType('video');
      loadVideoDimensions(url);
    }
  };

  const loadImageDimensions = (url: string) => {
    const img = new Image();
    img.onload = () => {
      setImageWidth(img.width);
      setImageHeight(img.height);
      setCropWidth(100);
      setCropHeight(100);
    };
    img.src = url;
  };

  const loadVideoDimensions = (url: string) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      setTrimEnd(video.duration);
      setVideoWidth(video.videoWidth);
      setVideoHeight(video.videoHeight);
    };
    video.src = url;
  };

  const handleFitToScreen = () => {
    if (fileType === 'image') {
      setImageWidth(SCREEN_WIDTH);
      setImageHeight(SCREEN_HEIGHT);
    } else if (fileType === 'video') {
      setVideoWidth(SCREEN_WIDTH);
      setVideoHeight(SCREEN_HEIGHT);
    }
    toast({
      title: 'Ajustado a pantalla',
      description: `Dimensiones: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}px`,
    });
  };

  const handleProcess = () => {
    if (!selectedFile) return;

    const metadata: MediaMetadata = {
      width: fileType === 'image' ? imageWidth : videoWidth,
      height: fileType === 'image' ? imageHeight : videoHeight,
    };

    if (fileType === 'video') {
      metadata.duration = trimEnd - trimStart;
      metadata.trimStart = trimStart;
      metadata.trimEnd = trimEnd;
    }

    onFileProcessed(selectedFile, metadata);

    toast({
      title: 'Medio procesado',
      description: 'El archivo está listo para subirse',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Editor de Medios Admin
          </CardTitle>
          <CardDescription>
            Sube y edita imágenes o videos. Pantalla: {SCREEN_WIDTH}x{SCREEN_HEIGHT}px
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div>
            <Label htmlFor="media-file">Seleccionar Archivo</Label>
            <Input
              id="media-file"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="mt-2"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="gap-1">
                  {fileType === 'image' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                  {fileType === 'image' ? 'Imagen' : 'Video'}
                </Badge>
                <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
              </div>
            )}
          </div>

          {selectedFile && (
            <Tabs defaultValue={fileType || 'image'} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Previa
                </TabsTrigger>
                <TabsTrigger value="edit">
                  {fileType === 'image' ? <Crop className="h-4 w-4 mr-2" /> : <Scissors className="h-4 w-4 mr-2" />}
                  Editar
                </TabsTrigger>
                <TabsTrigger value="dimensions">
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Dimensiones
                </TabsTrigger>
              </TabsList>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Vista Previa de Pantalla</CardTitle>
                    <CardDescription>
                      Escala: {(PREVIEW_SCALE * 100).toFixed(0)}% (Pantalla real: {SCREEN_WIDTH}x{SCREEN_HEIGHT}px)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="relative bg-black mx-auto border-4 border-primary/20 rounded-lg overflow-hidden"
                      style={{
                        width: SCREEN_WIDTH * PREVIEW_SCALE,
                        height: SCREEN_HEIGHT * PREVIEW_SCALE,
                      }}
                    >
                      {fileType === 'image' && previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {fileType === 'video' && previewUrl && (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Edit Tab */}
              <TabsContent value="edit" className="space-y-4">
                {fileType === 'image' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recortar Imagen</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Posición X (%)</Label>
                          <Slider
                            value={[cropX]}
                            onValueChange={(v) => setCropX(v[0])}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{cropX}%</span>
                        </div>
                        <div>
                          <Label>Posición Y (%)</Label>
                          <Slider
                            value={[cropY]}
                            onValueChange={(v) => setCropY(v[0])}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{cropY}%</span>
                        </div>
                        <div>
                          <Label>Ancho (%)</Label>
                          <Slider
                            value={[cropWidth]}
                            onValueChange={(v) => setCropWidth(v[0])}
                            min={10}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{cropWidth}%</span>
                        </div>
                        <div>
                          <Label>Alto (%)</Label>
                          <Slider
                            value={[cropHeight]}
                            onValueChange={(v) => setCropHeight(v[0])}
                            min={10}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                          <span className="text-xs text-muted-foreground">{cropHeight}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {fileType === 'video' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recortar Video</CardTitle>
                      <CardDescription>
                        Duración total: {videoDuration.toFixed(2)}s
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Inicio (segundos)</Label>
                        <Slider
                          value={[trimStart]}
                          onValueChange={(v) => setTrimStart(v[0])}
                          max={videoDuration}
                          step={0.1}
                          className="mt-2"
                        />
                        <span className="text-xs text-muted-foreground">{trimStart.toFixed(2)}s</span>
                      </div>
                      <div>
                        <Label>Fin (segundos)</Label>
                        <Slider
                          value={[trimEnd]}
                          onValueChange={(v) => setTrimEnd(v[0])}
                          max={videoDuration}
                          step={0.1}
                          className="mt-2"
                        />
                        <span className="text-xs text-muted-foreground">{trimEnd.toFixed(2)}s</span>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Duración final: {(trimEnd - trimStart).toFixed(2)}s</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Dimensions Tab */}
              <TabsContent value="dimensions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Dimensiones de Salida</CardTitle>
                    <CardDescription>
                      Pantalla objetivo: {SCREEN_WIDTH}x{SCREEN_HEIGHT}px
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ancho (px)</Label>
                        <Input
                          type="number"
                          value={fileType === 'image' ? imageWidth : videoWidth}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || SCREEN_WIDTH;
                            fileType === 'image' ? setImageWidth(val) : setVideoWidth(val);
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Alto (px)</Label>
                        <Input
                          type="number"
                          value={fileType === 'image' ? imageHeight : videoHeight}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || SCREEN_HEIGHT;
                            fileType === 'image' ? setImageHeight(val) : setVideoHeight(val);
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleFitToScreen}
                    >
                      <Maximize2 className="h-4 w-4 mr-2" />
                      Ajustar a Pantalla ({SCREEN_WIDTH}x{SCREEN_HEIGHT}px)
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {selectedFile && (
            <div className="flex gap-3">
              <Button
                onClick={handleProcess}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Procesar y Usar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setFileType(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

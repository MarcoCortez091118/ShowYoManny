import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Eye,
  Download,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Move,
  Minimize2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDisplaySettings } from '@/hooks/use-display-settings';

const PREVIEW_SCALE = 0.2;

type FitMode = 'contain' | 'cover' | 'fill' | 'none';

interface AdminMediaEditorProps {
  onFileProcessed: (file: File, metadata: MediaMetadata) => void;
}

interface MediaMetadata {
  width: number;
  height: number;
  duration?: number;
  trimStart?: number;
  trimEnd?: number;
  fitMode?: FitMode;
  zoom?: number;
  rotation?: number;
  positionX?: number;
  positionY?: number;
}

export const AdminMediaEditor = ({ onFileProcessed }: AdminMediaEditorProps) => {
  const { toast } = useToast();
  const { settings } = useDisplaySettings();
  const SCREEN_WIDTH = settings.screenWidth;
  const SCREEN_HEIGHT = settings.screenHeight;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);

  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const previewRef = useRef<HTMLDivElement>(null);

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

    setFitMode('contain');
    setZoom(100);
    setRotation(0);
    setPositionX(50);
    setPositionY(50);

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
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
    };
    img.src = url;
  };

  const loadVideoDimensions = (url: string) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      setTrimEnd(video.duration);
      setOriginalWidth(video.videoWidth);
      setOriginalHeight(video.videoHeight);
    };
    video.src = url;
  };

  const handleFitToScreen = () => {
    setFitMode('fill');
    setZoom(100);
    setRotation(0);
    setPositionX(50);
    setPositionY(50);
    toast({
      title: 'Ajustado a pantalla',
      description: `Imagen ajustada a ${SCREEN_WIDTH}x${SCREEN_HEIGHT}px`,
    });
  };

  const handleResetTransform = () => {
    setFitMode('contain');
    setZoom(100);
    setRotation(0);
    setPositionX(50);
    setPositionY(50);
    toast({
      title: 'Transformación reiniciada',
      description: 'Todos los ajustes han sido restaurados',
    });
  };

  const getPreviewStyle = () => {
    let objectFit: string = fitMode;
    if (fitMode === 'none') {
      objectFit = 'none';
    }

    return {
      objectFit: objectFit as any,
      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
      objectPosition: `${positionX}% ${positionY}%`,
      transition: 'all 0.3s ease',
    };
  };

  const handleProcess = () => {
    if (!selectedFile) return;

    const metadata: MediaMetadata = {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      fitMode,
      zoom,
      rotation,
      positionX,
      positionY,
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

  const getOrientationLabel = () => {
    if (!originalWidth || !originalHeight) return '';
    const ratio = originalWidth / originalHeight;
    if (ratio > 1.3) return 'Horizontal (Landscape)';
    if (ratio < 0.7) return 'Vertical (Portrait)';
    return 'Cuadrado';
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
            Sube y ajusta imágenes o videos. Pantalla: {SCREEN_WIDTH}x{SCREEN_HEIGHT}px
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  {fileType === 'image' ? <ImageIcon className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                  {fileType === 'image' ? 'Imagen' : 'Video'}
                </Badge>
                <Badge variant="secondary">
                  {originalWidth}x{originalHeight}px
                </Badge>
                <Badge variant="secondary">
                  {getOrientationLabel()}
                </Badge>
                <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="text-sm">Vista Previa de Pantalla</CardTitle>
                    <CardDescription>
                      Escala: {(PREVIEW_SCALE * 100).toFixed(0)}% - Pantalla real: {SCREEN_WIDTH}x{SCREEN_HEIGHT}px
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      ref={previewRef}
                      className="relative bg-black mx-auto border-4 border-primary/20 rounded-lg overflow-hidden shadow-2xl"
                      style={{
                        width: SCREEN_WIDTH * PREVIEW_SCALE,
                        height: SCREEN_HEIGHT * PREVIEW_SCALE,
                      }}
                    >
                      {/* Cuadrícula de referencia */}
                      <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white/20" />
                          ))}
                        </div>
                      </div>
                      {fileType === 'image' && previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full"
                          style={getPreviewStyle()}
                          draggable={false}
                        />
                      )}
                      {fileType === 'video' && previewUrl && (
                        <video
                          src={previewUrl}
                          controls
                          loop
                          muted
                          autoPlay
                          className="w-full h-full"
                          style={getPreviewStyle()}
                        />
                      )}

                      <div className="absolute top-2 left-2 right-2 flex flex-col gap-1 text-xs text-white bg-black/70 rounded p-2">
                        <div className="flex justify-between">
                          <span>Modo: {fitMode}</span>
                          <span>Zoom: {zoom}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rotación: {rotation}°</span>
                          <span>Pos: X{positionX}% Y{positionY}%</span>
                        </div>
                      </div>

                      {/* Crosshair para mostrar la posición */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div
                          className="absolute w-px h-full bg-cyan-500/50"
                          style={{ left: `${positionX}%` }}
                        />
                        <div
                          className="absolute w-full h-px bg-cyan-500/50"
                          style={{ top: `${positionY}%` }}
                        />
                        <div
                          className="absolute w-2 h-2 bg-cyan-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${positionX}%`, top: `${positionY}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Modo de Ajuste</CardTitle>
                    <CardDescription>
                      Controla cómo se ajusta el contenido a la pantalla
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Modo de Ajuste</Label>
                      <Select value={fitMode} onValueChange={(v) => setFitMode(v as FitMode)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contain">Contain - Mostrar todo (con barras)</SelectItem>
                          <SelectItem value="cover">Cover - Llenar pantalla (recortar)</SelectItem>
                          <SelectItem value="fill">Fill - Estirar a pantalla</SelectItem>
                          <SelectItem value="none">None - Tamaño original</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={handleFitToScreen}
                        className="w-full"
                      >
                        <Maximize2 className="h-4 w-4 mr-2" />
                        Ajustar a Pantalla
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResetTransform}
                        className="w-full"
                      >
                        <Minimize2 className="h-4 w-4 mr-2" />
                        Reiniciar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Transformaciones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <ZoomIn className="h-4 w-4" />
                          Zoom
                        </Label>
                        <span className="text-sm text-muted-foreground">{zoom}%</span>
                      </div>
                      <Slider
                        value={[zoom]}
                        onValueChange={(v) => setZoom(v[0])}
                        min={10}
                        max={300}
                        step={5}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <RotateCw className="h-4 w-4" />
                          Rotación
                        </Label>
                        <span className="text-sm text-muted-foreground">{rotation}°</span>
                      </div>
                      <Slider
                        value={[rotation]}
                        onValueChange={(v) => setRotation(v[0])}
                        min={0}
                        max={360}
                        step={15}
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRotation((rotation - 90 + 360) % 360)}
                        >
                          -90°
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRotation((rotation + 90) % 360)}
                        >
                          +90°
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Move className="h-4 w-4" />
                          Posición X
                        </Label>
                        <span className="text-sm text-muted-foreground">{positionX}%</span>
                      </div>
                      <Slider
                        value={[positionX]}
                        onValueChange={(v) => setPositionX(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="flex items-center gap-2">
                          <Move className="h-4 w-4" />
                          Posición Y
                        </Label>
                        <span className="text-sm text-muted-foreground">{positionY}%</span>
                      </div>
                      <Slider
                        value={[positionY]}
                        onValueChange={(v) => setPositionY(v[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>

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
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ Paso importante: Haz click en "Procesar y Usar" para habilitar el botón de upload
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleProcess}
                  className="flex-1"
                  size="lg"
                  variant="default"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Procesar y Usar Este Archivo
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

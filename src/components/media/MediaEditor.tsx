import { DisplaySettings } from "@/domain/services/displaySettingsService";
import { ImageFitMode } from "@/utils/imageProcessing";
import { ImageEditor } from "./ImageEditor";
import { VideoEditor } from "./VideoEditor";

interface MediaEditorProps {
  file: File;
  settings: DisplaySettings;
  onImageChange: (result: {
    file: File;
    previewUrl: string;
    width: number;
    height: number;
    zoom: number;
    offsetXPercent: number;
    offsetYPercent: number;
    fitMode: ImageFitMode;
  }) => void;
  onVideoChange: (result: {
    file: File;
    previewUrl: string;
    trimStartSeconds: number;
    trimEndSeconds: number;
    durationSeconds: number;
  }) => void;
}

export const MediaEditor = ({ file, settings, onImageChange, onVideoChange }: MediaEditorProps) => {
  if (file.type.startsWith("image/")) {
    return <ImageEditor file={file} settings={settings} onChange={onImageChange} />;
  }

  if (file.type.startsWith("video/")) {
    return <VideoEditor file={file} settings={settings} onChange={onVideoChange} />;
  }

  return null;
};

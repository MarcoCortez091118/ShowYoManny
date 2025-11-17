import { DisplaySettings } from "@/domain/services/displaySettingsService";
import { ImageFitMode } from "@/utils/imageProcessing";
import { ImageEditor } from "./ImageEditor";
import { VideoEditor } from "./VideoEditor";

interface MediaEditorProps {
  file: File;
  settings: DisplaySettings;
  includesLogo?: boolean;
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

export const MediaEditor = ({ file, settings, includesLogo = false, onImageChange, onVideoChange }: MediaEditorProps) => {
  if (file.type.startsWith("image/")) {
    return <ImageEditor file={file} settings={settings} includesLogo={includesLogo} onChange={onImageChange} />;
  }

  if (file.type.startsWith("video/")) {
    return <VideoEditor file={file} settings={settings} includesLogo={includesLogo} onChange={onVideoChange} />;
  }

  return null;
};

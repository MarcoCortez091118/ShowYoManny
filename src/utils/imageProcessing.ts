export interface ImageTransformOptions {
  targetWidth: number;
  targetHeight: number;
  zoom: number;
  offsetXPercent: number;
  offsetYPercent: number;
}

interface ImageMetrics {
  width: number;
  height: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

async function readImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function calculateCropArea(metrics: ImageMetrics, options: ImageTransformOptions) {
  const { width, height } = metrics;
  const desiredAspect = options.targetWidth / options.targetHeight;

  const zoom = clamp(options.zoom, 1, 5);
  let cropWidth = width / zoom;
  let cropHeight = height / zoom;

  const cropAspect = cropWidth / cropHeight;
  if (cropAspect > desiredAspect) {
    const newCropWidth = cropHeight * desiredAspect;
    cropWidth = newCropWidth;
  } else if (cropAspect < desiredAspect) {
    const newCropHeight = cropWidth / desiredAspect;
    cropHeight = newCropHeight;
  }

  const maxOffsetX = Math.max(0, (width - cropWidth) / 2);
  const maxOffsetY = Math.max(0, (height - cropHeight) / 2);

  const offsetX = clamp(options.offsetXPercent, -1, 1) * maxOffsetX;
  const offsetY = clamp(options.offsetYPercent, -1, 1) * maxOffsetY;

  const sourceX = clamp((width - cropWidth) / 2 + offsetX, 0, Math.max(0, width - cropWidth));
  const sourceY = clamp((height - cropHeight) / 2 + offsetY, 0, Math.max(0, height - cropHeight));

  return {
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
  };
}

export async function transformImageToResolution(
  file: File,
  options: ImageTransformOptions
): Promise<{ file: File; previewUrl: string; width: number; height: number }> {
  const image = await readImage(file);
  const metrics: ImageMetrics = {
    width: image.naturalWidth,
    height: image.naturalHeight,
  };

  const { sourceX, sourceY, cropWidth, cropHeight } = calculateCropArea(metrics, options);

  const canvas = document.createElement("canvas");
  canvas.width = options.targetWidth;
  canvas.height = options.targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to process image - canvas context unavailable");
  }

  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    options.targetWidth,
    options.targetHeight
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, file.type || "image/png", 0.92)
  );

  if (!blob) {
    throw new Error("Unable to generate processed image");
  }

  const processedFile = new File([blob], `edited-${file.name}`, { type: blob.type });
  const previewUrl = URL.createObjectURL(blob);

  return {
    file: processedFile,
    previewUrl,
    width: options.targetWidth,
    height: options.targetHeight,
  };
}

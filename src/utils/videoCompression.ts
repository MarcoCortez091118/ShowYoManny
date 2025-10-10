export interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'trimming' | 'complete';
  progress: number;
  message: string;
}

export interface CompressionOptions {
  maxSizeMB?: number;
  targetBitrate?: number;
  onProgress?: (progress: CompressionProgress) => void;
}

const DEFAULT_MAX_SIZE_MB = 45;
const DEFAULT_TARGET_BITRATE = 2500000;

export async function compressAndTrimVideo(
  file: File,
  trimStart: number,
  trimEnd: number,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    targetBitrate = DEFAULT_TARGET_BITRATE,
    onProgress
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  onProgress?.({
    stage: 'loading',
    progress: 10,
    message: 'Cargando video...'
  });

  const videoBlob = await loadVideoBlob(file, trimStart, trimEnd, (p) => {
    onProgress?.({
      stage: 'trimming',
      progress: 10 + (p * 0.3),
      message: 'Recortando video...'
    });
  });

  onProgress?.({
    stage: 'compressing',
    progress: 40,
    message: 'Comprimiendo video...'
  });

  if (videoBlob.size <= maxSizeBytes) {
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Video procesado'
    });

    const fileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4';
    return new File([videoBlob], fileName, { type: 'video/mp4' });
  }

  const compressedBlob = await compressVideoBlob(videoBlob, targetBitrate, maxSizeBytes, (p) => {
    onProgress?.({
      stage: 'compressing',
      progress: 40 + (p * 0.5),
      message: `Comprimiendo video... ${Math.round(p * 100)}%`
    });
  });

  onProgress?.({
    stage: 'complete',
    progress: 100,
    message: 'Video procesado exitosamente'
  });

  const fileName = file.name.replace(/\.[^/.]+$/, '') + '_compressed.mp4';
  return new File([compressedBlob], fileName, { type: 'video/mp4' });
}

async function loadVideoBlob(
  file: File,
  trimStart: number,
  trimEnd: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo crear contexto de canvas'));
      return;
    }

    video.src = URL.createObjectURL(file);
    video.muted = true;

    video.onloadedmetadata = async () => {
      try {
        canvas.width = Math.min(video.videoWidth, 1920);
        canvas.height = Math.min(video.videoHeight, 1080);

        const stream = canvas.captureStream(30);
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        stream.addTrack(destination.stream.getAudioTracks()[0]);

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2500000
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(video.src);
          resolve(blob);
        };

        video.currentTime = trimStart;
        await new Promise(r => { video.onseeked = r; });

        mediaRecorder.start();
        video.play();

        const duration = trimEnd - trimStart;
        const startTime = Date.now();

        const drawFrame = () => {
          if (video.currentTime >= trimEnd || video.ended) {
            mediaRecorder.stop();
            video.pause();
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const elapsed = (Date.now() - startTime) / 1000;
          const progress = Math.min(elapsed / duration, 1);
          onProgress?.(progress);

          requestAnimationFrame(drawFrame);
        };

        drawFrame();

      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Error al cargar el video'));
    };
  });
}

async function compressVideoBlob(
  blob: Blob,
  targetBitrate: number,
  maxSize: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('No se pudo crear contexto de canvas'));
      return;
    }

    video.src = URL.createObjectURL(blob);
    video.muted = true;

    video.onloadedmetadata = async () => {
      try {
        const scale = Math.min(1, Math.sqrt(maxSize / blob.size));
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);

        const stream = canvas.captureStream(25);

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp8',
          videoBitsPerSecond: Math.floor(targetBitrate * scale)
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const compressed = new Blob(chunks, { type: 'video/webm' });
          URL.revokeObjectURL(video.src);
          resolve(compressed);
        };

        mediaRecorder.start();
        video.play();

        const duration = video.duration;
        const startTime = Date.now();

        const drawFrame = () => {
          if (video.ended) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const elapsed = (Date.now() - startTime) / 1000;
          const progress = Math.min(elapsed / duration, 1);
          onProgress?.(progress);

          requestAnimationFrame(drawFrame);
        };

        drawFrame();

      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Error al comprimir el video'));
    };
  });
}

export function getVideoFileSize(file: File): number {
  return file.size;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function estimateCompressionTime(fileSizeMB: number): number {
  return Math.max(10, Math.floor(fileSizeMB * 2));
}

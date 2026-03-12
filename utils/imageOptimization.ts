import type { ImageGuide } from './adminImageGuides';

export interface OptimizeUploadOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  maxBytes?: number;
  fit?: 'cover' | 'contain';
  fileNamePrefix?: string;
}

export interface OptimizedUploadResult {
  file: File;
  originalBytes: number;
  optimizedBytes: number;
  width: number;
  height: number;
  reducedPercent: number;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'origin' | 'webp';
}

const DEFAULT_QUALITY = 0.82;

const isImageFile = (file: File) => file.type.startsWith('image/');

const loadImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to decode image file.'));
    };
    image.src = objectUrl;
  });

const computeTargetSize = (
  sourceWidth: number,
  sourceHeight: number,
  options: OptimizeUploadOptions
) => {
  const { targetWidth, targetHeight, fit = 'contain' } = options;

  if (!targetWidth && !targetHeight) {
    return { width: sourceWidth, height: sourceHeight };
  }

  if (targetWidth && targetHeight) {
    if (fit === 'cover') {
      return { width: targetWidth, height: targetHeight };
    }

    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;

    if (sourceRatio > targetRatio) {
      return { width: targetWidth, height: Math.round(targetWidth / sourceRatio) };
    }
    return { width: Math.round(targetHeight * sourceRatio), height: targetHeight };
  }

  if (targetWidth) {
    const ratio = targetWidth / sourceWidth;
    return { width: targetWidth, height: Math.round(sourceHeight * ratio) };
  }

  const ratio = (targetHeight || sourceHeight) / sourceHeight;
  return { width: Math.round(sourceWidth * ratio), height: targetHeight || sourceHeight };
};

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image conversion failed.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });

const toWebpFileName = (originalName: string, fileNamePrefix?: string) => {
  const base = originalName.replace(/\.[^.]+$/, '');
  const safeBase = base.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').toLowerCase();
  const prefix = fileNamePrefix ? `${fileNamePrefix}-` : '';
  return `${prefix}${safeBase}-${Date.now()}.webp`;
};

export const optimizeImageForUpload = async (
  file: File,
  options: OptimizeUploadOptions = {}
): Promise<OptimizedUploadResult> => {
  if (!isImageFile(file)) {
    return {
      file,
      originalBytes: file.size,
      optimizedBytes: file.size,
      width: 0,
      height: 0,
      reducedPercent: 0
    };
  }

  const image = await loadImageElement(file);
  const target = computeTargetSize(image.naturalWidth, image.naturalHeight, options);

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, target.width);
  canvas.height = Math.max(1, target.height);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context is not available.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const initialQuality = Math.min(1, Math.max(0.35, options.quality ?? DEFAULT_QUALITY));
  let blob = await canvasToBlob(canvas, initialQuality);

  if (options.maxBytes && blob.size > options.maxBytes) {
    let quality = initialQuality;
    while (blob.size > options.maxBytes && quality > 0.4) {
      quality -= 0.06;
      blob = await canvasToBlob(canvas, quality);
    }
  }

  const fileName = toWebpFileName(file.name, options.fileNamePrefix);
  const optimizedFile = new File([blob], fileName, { type: 'image/webp' });
  const reducedPercent =
    file.size > 0 ? Math.max(0, Math.round(((file.size - optimizedFile.size) / file.size) * 100)) : 0;

  return {
    file: optimizedFile,
    originalBytes: file.size,
    optimizedBytes: optimizedFile.size,
    width: canvas.width,
    height: canvas.height,
    reducedPercent
  };
};

export const optimizeImageByGuide = async (
  file: File,
  guide: ImageGuide,
  options: Pick<OptimizeUploadOptions, 'fit' | 'fileNamePrefix'> = {}
) => {
  const maxBytes = guide.maxSizeMb ? guide.maxSizeMb * 1024 * 1024 : undefined;
  return optimizeImageForUpload(file, {
    targetWidth: guide.recommendedWidth,
    targetHeight: guide.recommendedHeight,
    maxBytes,
    fit: options.fit ?? (guide.strictAspect ? 'cover' : 'contain'),
    fileNamePrefix: options.fileNamePrefix
  });
};

const extractPublicBucketAndPath = (publicUrl: string): { bucket: string; filePath: string } | null => {
  try {
    const url = new URL(publicUrl);
    const objectMarker = '/storage/v1/object/public/';
    const objectIndex = url.pathname.indexOf(objectMarker);
    if (objectIndex === -1) return null;
    const remaining = url.pathname.slice(objectIndex + objectMarker.length);
    const [bucket, ...rest] = remaining.split('/');
    if (!bucket || rest.length === 0) return null;
    return { bucket, filePath: rest.join('/') };
  } catch {
    return null;
  }
};

export const buildSupabaseTransformedUrl = (publicUrl: string, options: ImageTransformOptions = {}) => {
  const extracted = extractPublicBucketAndPath(publicUrl);
  if (!extracted) return publicUrl;

  const sourceUrl = new URL(publicUrl);
  const renderPath = `/storage/v1/render/image/public/${extracted.bucket}/${extracted.filePath}`;
  const renderUrl = new URL(renderPath, `${sourceUrl.protocol}//${sourceUrl.host}`);

  if (options.width) renderUrl.searchParams.set('width', String(Math.round(options.width)));
  if (options.height) renderUrl.searchParams.set('height', String(Math.round(options.height)));
  if (typeof options.quality === 'number') renderUrl.searchParams.set('quality', String(Math.round(options.quality)));
  if (options.format && options.format !== 'origin') renderUrl.searchParams.set('format', options.format);

  return renderUrl.toString();
};

export const buildResponsiveSrcSet = (
  publicUrl: string,
  widths: number[] = [320, 480, 640, 768, 960, 1200]
) =>
  widths
    .map((width) => `${buildSupabaseTransformedUrl(publicUrl, { width, quality: 80, format: 'webp' })} ${width}w`)
    .join(', ');

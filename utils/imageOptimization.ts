import type { ImageGuide } from './adminImageGuides';

export interface OptimizeUploadOptions {
  targetWidth?: number;
  targetHeight?: number;
  quality?: number;
  maxBytes?: number;
  fit?: 'cover' | 'contain';
  fileNamePrefix?: string;
  outputFormat?: 'webp' | 'avif' | 'jpeg';
  baseName?: string;
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
  format?: 'origin' | 'webp' | 'avif';
}

export interface ResponsiveUploadAsset {
  file: File;
  width: number;
  format: 'avif' | 'webp';
  kind: 'variant' | 'placeholder';
}

export interface ResponsiveProductUploadBundle {
  master: OptimizedUploadResult;
  assets: ResponsiveUploadAsset[];
  supportsAvif: boolean;
}

export interface ResponsivePictureSourceSet {
  avifSrcSet?: string;
  webpSrcSet?: string;
  fallbackSrcSet?: string;
  fallbackSrc: string;
  placeholderSrc?: string;
  isVector: boolean;
}

const DEFAULT_QUALITY = 0.82;
const MASTER_MARKER = '-master';
const DEFAULT_PLACEHOLDER_WIDTH = 40;
export const DEFAULT_RESPONSIVE_IMAGE_WIDTHS = [400, 800, 1200, 1600] as const;

const mimeSupportCache = new Map<string, Promise<boolean>>();

const isImageFile = (file: File) => file.type.startsWith('image/');
const isSvgMime = (mimeType?: string) => (mimeType || '').toLowerCase().includes('svg');
const isSvgUrl = (value: string) =>
  String(value || '').trim().toLowerCase().startsWith('data:image/svg') ||
  /\.svg(?:\?|#|$)/i.test(String(value || '').trim());
const isRasterUrl = (value: string) => Boolean(value) && !isSvgUrl(value);
const isUnsplashUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.hostname.endsWith('images.unsplash.com');
  } catch {
    return false;
  }
};

const outputFormatToMimeType = (format: OptimizeUploadOptions['outputFormat']) => {
  if (format === 'avif') return 'image/avif';
  if (format === 'jpeg') return 'image/jpeg';
  return 'image/webp';
};

const fileExtensionForFormat = (format: OptimizeUploadOptions['outputFormat']) => {
  if (format === 'avif') return 'avif';
  if (format === 'jpeg') return 'jpg';
  return 'webp';
};

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
  const fit = options.fit || 'contain';
  const targetWidth = options.targetWidth ? Math.min(options.targetWidth, sourceWidth) : undefined;
  const targetHeight = options.targetHeight ? Math.min(options.targetHeight, sourceHeight) : undefined;

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
      return { width: targetWidth, height: Math.max(1, Math.round(targetWidth / sourceRatio)) };
    }
    return { width: Math.max(1, Math.round(targetHeight * sourceRatio)), height: targetHeight };
  }

  if (targetWidth) {
    const ratio = targetWidth / sourceWidth;
    return { width: targetWidth, height: Math.max(1, Math.round(sourceHeight * ratio)) };
  }

  const ratio = (targetHeight || sourceHeight) / sourceHeight;
  return {
    width: Math.max(1, Math.round(sourceWidth * ratio)),
    height: targetHeight || sourceHeight
  };
};

const drawImageToCanvas = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  fit: 'cover' | 'contain'
) => {
  context.clearRect(0, 0, canvasWidth, canvasHeight);

  const widthRatio = canvasWidth / image.naturalWidth;
  const heightRatio = canvasHeight / image.naturalHeight;
  const scale = fit === 'cover' ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio);

  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Image conversion failed.'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      mimeType === 'image/png' ? undefined : quality
    );
  });

const checkMimeTypeSupport = (mimeType: string): Promise<boolean> => {
  if (mimeSupportCache.has(mimeType)) {
    return mimeSupportCache.get(mimeType)!;
  }

  const promise = (async () => {
    if (typeof document === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    const context = canvas.getContext('2d');
    if (!context) return false;
    context.fillStyle = '#ff3366';
    context.fillRect(0, 0, 2, 2);

    try {
      const blob = await canvasToBlob(canvas, mimeType, 0.8);
      return blob.type === mimeType;
    } catch {
      return false;
    }
  })();

  mimeSupportCache.set(mimeType, promise);
  return promise;
};

const sanitizeFileName = (name: string) =>
  String(name || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase();

const buildUploadBaseName = (originalName: string, fileNamePrefix?: string) => {
  const safeBase = sanitizeFileName(originalName);
  const prefix = fileNamePrefix ? `${sanitizeFileName(fileNamePrefix)}-` : '';
  return `${prefix}${safeBase}-${Date.now()}`;
};

const createFileFromImage = async (
  image: HTMLImageElement,
  sourceName: string,
  originalBytes: number,
  options: OptimizeUploadOptions
): Promise<OptimizedUploadResult> => {
  const target = computeTargetSize(image.naturalWidth, image.naturalHeight, options);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, target.width);
  canvas.height = Math.max(1, target.height);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas context is not available.');

  drawImageToCanvas(context, image, canvas.width, canvas.height, options.fit || 'contain');

  const format = options.outputFormat || 'webp';
  const mimeType = outputFormatToMimeType(format);
  const quality = Math.min(1, Math.max(0.35, options.quality ?? DEFAULT_QUALITY));

  let blob = await canvasToBlob(canvas, mimeType, quality);
  if (options.maxBytes && blob.size > options.maxBytes) {
    let nextQuality = quality;
    while (blob.size > options.maxBytes && nextQuality > 0.38) {
      nextQuality -= 0.05;
      blob = await canvasToBlob(canvas, mimeType, nextQuality);
    }
  }

  const baseName = options.baseName || buildUploadBaseName(sourceName, options.fileNamePrefix);
  const extension = fileExtensionForFormat(format);
  const outputFile = new File([blob], `${baseName}.${extension}`, { type: mimeType });
  const reducedPercent =
    originalBytes > 0
      ? Math.max(0, Math.round(((originalBytes - outputFile.size) / originalBytes) * 100))
      : 0;

  return {
    file: outputFile,
    originalBytes,
    optimizedBytes: outputFile.size,
    width: canvas.width,
    height: canvas.height,
    reducedPercent
  };
};

export const optimizeImageForUpload = async (
  file: File,
  options: OptimizeUploadOptions = {}
): Promise<OptimizedUploadResult> => {
  if (!isImageFile(file) || isSvgMime(file.type)) {
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
  return createFileFromImage(image, file.name, file.size, options);
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

export const buildResponsiveProductUploadBundle = async (
  file: File,
  options: {
    fileNamePrefix?: string;
    widths?: number[];
    quality?: number;
    fit?: 'cover' | 'contain';
  } = {}
): Promise<ResponsiveProductUploadBundle> => {
  if (!isImageFile(file) || isSvgMime(file.type)) {
    const master = await optimizeImageForUpload(file, {
      fileNamePrefix: options.fileNamePrefix,
      outputFormat: 'webp'
    });
    return { master, assets: [], supportsAvif: false };
  }

  const image = await loadImageElement(file);
  const widths = Array.from(
    new Set(
      (options.widths || [...DEFAULT_RESPONSIVE_IMAGE_WIDTHS])
        .map((width) => Math.max(1, Math.min(width, image.naturalWidth)))
        .sort((a, b) => a - b)
    )
  );

  const baseName = buildUploadBaseName(file.name, options.fileNamePrefix);
  const master = await createFileFromImage(image, file.name, file.size, {
    targetWidth: Math.min(1600, image.naturalWidth),
    fit: options.fit || 'contain',
    quality: options.quality ?? 0.84,
    outputFormat: 'webp',
    baseName: `${baseName}${MASTER_MARKER}`
  });

  const supportsAvif = await checkMimeTypeSupport('image/avif');
  const assets: ResponsiveUploadAsset[] = [];
  const formats: Array<'avif' | 'webp'> = supportsAvif ? ['avif', 'webp'] : ['webp'];

  for (const width of widths) {
    for (const format of formats) {
      const variant = await createFileFromImage(image, file.name, file.size, {
        targetWidth: width,
        fit: options.fit || 'contain',
        quality: format === 'avif' ? 0.66 : 0.8,
        outputFormat: format,
        baseName: `${baseName}-w${width}`
      });

      assets.push({
        file: variant.file,
        width: variant.width,
        format,
        kind: 'variant'
      });
    }
  }

  const placeholder = await createFileFromImage(image, file.name, file.size, {
    targetWidth: Math.min(DEFAULT_PLACEHOLDER_WIDTH, image.naturalWidth),
    fit: options.fit || 'contain',
    quality: 0.55,
    outputFormat: 'webp',
    baseName: `${baseName}-w${DEFAULT_PLACEHOLDER_WIDTH}`
  });

  assets.push({
    file: placeholder.file,
    width: placeholder.width,
    format: 'webp',
    kind: 'placeholder'
  });

  return { master, assets, supportsAvif };
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

const extractResponsiveVariantBase = (publicUrl: string) => {
  try {
    const url = new URL(publicUrl);
    const pathname = url.pathname;
    const match = pathname.match(/^(.*)\/([^/]+)-master\.(webp|jpg|jpeg)$/i);
    if (!match) return null;
    return {
      origin: `${url.protocol}//${url.host}`,
      directory: match[1],
      baseName: match[2],
      masterFormat: match[3].toLowerCase()
    };
  } catch {
    return null;
  }
};

const buildVariantUrl = (publicUrl: string, width: number, format: 'avif' | 'webp') => {
  const base = extractResponsiveVariantBase(publicUrl);
  if (!base) return '';
  return `${base.origin}${base.directory}/${base.baseName}-w${width}.${format}`;
};

const buildVariantPlaceholderUrl = (publicUrl: string) => {
  const base = extractResponsiveVariantBase(publicUrl);
  if (!base) return '';
  return `${base.origin}${base.directory}/${base.baseName}-w${DEFAULT_PLACEHOLDER_WIDTH}.webp`;
};

const buildUnsplashVariantUrl = (
  publicUrl: string,
  width: number,
  format?: 'avif' | 'webp'
) => {
  try {
    const url = new URL(publicUrl);
    url.searchParams.set('w', String(width));
    url.searchParams.set('q', width <= 400 ? '60' : width <= 800 ? '68' : width <= 1200 ? '74' : '80');
    url.searchParams.set('fit', 'max');
    url.searchParams.set('auto', 'format');
    if (format) url.searchParams.set('fm', format);
    return url.toString();
  } catch {
    return publicUrl;
  }
};

export const buildSupabaseTransformedUrl = (publicUrl: string, _options: ImageTransformOptions = {}) => {
  return publicUrl;
};

export const buildResponsiveSrcSet = (
  publicUrl: string,
  widths: number[] = [...DEFAULT_RESPONSIVE_IMAGE_WIDTHS]
) => {
  const variantBase = extractResponsiveVariantBase(publicUrl);
  if (variantBase) {
    return widths.map((width) => `${buildVariantUrl(publicUrl, width, 'webp')} ${width}w`).join(', ');
  }

  if (isUnsplashUrl(publicUrl)) {
    return widths.map((width) => `${buildUnsplashVariantUrl(publicUrl, width, 'webp')} ${width}w`).join(', ');
  }

  return '';
};

export const buildResponsivePictureSources = (
  publicUrl: string,
  options: {
    widths?: number[];
  } = {}
): ResponsivePictureSourceSet => {
  const widths = options.widths && options.widths.length > 0
    ? Array.from(new Set(options.widths.map((value) => Math.max(1, Math.round(value))))).sort((a, b) => a - b)
    : [...DEFAULT_RESPONSIVE_IMAGE_WIDTHS];

  if (!isRasterUrl(publicUrl)) {
    return {
      fallbackSrc: publicUrl,
      isVector: true
    };
  }

  const responsiveVariantBase = extractResponsiveVariantBase(publicUrl);
  if (responsiveVariantBase) {
    return {
      avifSrcSet: widths.map((width) => `${buildVariantUrl(publicUrl, width, 'avif')} ${width}w`).join(', '),
      webpSrcSet: widths.map((width) => `${buildVariantUrl(publicUrl, width, 'webp')} ${width}w`).join(', '),
      fallbackSrc: publicUrl,
      placeholderSrc: buildVariantPlaceholderUrl(publicUrl),
      isVector: false
    };
  }

  if (isUnsplashUrl(publicUrl)) {
    return {
      avifSrcSet: widths.map((width) => `${buildUnsplashVariantUrl(publicUrl, width, 'avif')} ${width}w`).join(', '),
      webpSrcSet: widths.map((width) => `${buildUnsplashVariantUrl(publicUrl, width, 'webp')} ${width}w`).join(', '),
      fallbackSrcSet: widths.map((width) => `${buildUnsplashVariantUrl(publicUrl, width)} ${width}w`).join(', '),
      fallbackSrc: buildUnsplashVariantUrl(publicUrl, Math.max(...widths)),
      placeholderSrc: buildUnsplashVariantUrl(publicUrl, DEFAULT_PLACEHOLDER_WIDTH, 'webp'),
      isVector: false
    };
  }

  return {
    fallbackSrc: publicUrl,
    isVector: false
  };
};

export const canDeriveResponsiveVariants = (publicUrl: string) =>
  Boolean(extractResponsiveVariantBase(publicUrl)) || isUnsplashUrl(publicUrl);

export const getResponsiveUploadTargetWidths = () => [...DEFAULT_RESPONSIVE_IMAGE_WIDTHS];

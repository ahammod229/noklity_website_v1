export interface ImageGuide {
  label: string;
  recommendedWidth: number;
  recommendedHeight: number;
  minimumWidth: number;
  minimumHeight: number;
  maxSizeMb?: number;
  strictAspect?: boolean;
}

export interface ImageGuideValidationResult {
  width: number;
  height: number;
  isPerfect: boolean;
  shouldBlock: boolean;
  message: string;
}

export const ADMIN_IMAGE_GUIDES = {
  productPrimary: {
    label: 'Product primary image',
    recommendedWidth: 1200,
    recommendedHeight: 1200,
    minimumWidth: 800,
    minimumHeight: 800,
    maxSizeMb: 5,
    strictAspect: true
  } as ImageGuide,
  productGallery: {
    label: 'Product gallery image',
    recommendedWidth: 1200,
    recommendedHeight: 1200,
    minimumWidth: 800,
    minimumHeight: 800,
    maxSizeMb: 5,
    strictAspect: true
  } as ImageGuide,
  heroBanner: {
    label: 'Hero banner',
    recommendedWidth: 1920,
    recommendedHeight: 760,
    minimumWidth: 1440,
    minimumHeight: 560,
    maxSizeMb: 6,
    strictAspect: true
  } as ImageGuide,
  categoryLogo: {
    label: 'Category logo',
    recommendedWidth: 512,
    recommendedHeight: 512,
    minimumWidth: 256,
    minimumHeight: 256,
    maxSizeMb: 2,
    strictAspect: true
  } as ImageGuide,
  paymentLogo: {
    label: 'Payment method logo',
    recommendedWidth: 512,
    recommendedHeight: 512,
    minimumWidth: 256,
    minimumHeight: 256,
    maxSizeMb: 2,
    strictAspect: true
  } as ImageGuide,
  headerLogo: {
    label: 'Header logo',
    recommendedWidth: 440,
    recommendedHeight: 140,
    minimumWidth: 300,
    minimumHeight: 96,
    maxSizeMb: 2,
    strictAspect: false
  } as ImageGuide,
  footerLogo: {
    label: 'Footer logo',
    recommendedWidth: 420,
    recommendedHeight: 120,
    minimumWidth: 280,
    minimumHeight: 80,
    maxSizeMb: 2,
    strictAspect: false
  } as ImageGuide,
  favicon: {
    label: 'Favicon',
    recommendedWidth: 64,
    recommendedHeight: 64,
    minimumWidth: 32,
    minimumHeight: 32,
    maxSizeMb: 1,
    strictAspect: true
  } as ImageGuide,
  linkBar: {
    label: 'Link bar image',
    recommendedWidth: 1600,
    recommendedHeight: 240,
    minimumWidth: 1200,
    minimumHeight: 180,
    maxSizeMb: 4,
    strictAspect: false
  } as ImageGuide
};

const MAX_ASPECT_DIFF_RATIO = 0.05;

const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image dimensions.'));
    };
    image.src = objectUrl;
  });

const formatSize = (width: number, height: number) => `${width}x${height}px`;

export const formatImageGuideHint = (guide: ImageGuide) => {
  const chunks = [
    `Recommended: ${formatSize(guide.recommendedWidth, guide.recommendedHeight)}`,
    `Minimum: ${formatSize(guide.minimumWidth, guide.minimumHeight)}`
  ];
  if (guide.maxSizeMb) chunks.push(`Max: ${guide.maxSizeMb}MB`);
  return chunks.join(' • ');
};

export const validateImageAgainstGuide = async (
  file: File,
  guide: ImageGuide
): Promise<ImageGuideValidationResult> => {
  if (guide.maxSizeMb) {
    const maxBytes = guide.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return {
        width: 0,
        height: 0,
        isPerfect: false,
        shouldBlock: true,
        message: `${guide.label}: file is too large. Max size is ${guide.maxSizeMb}MB.`
      };
    }
  }

  const { width, height } = await loadImageDimensions(file);
  const isPerfect = width === guide.recommendedWidth && height === guide.recommendedHeight;

  const isTooSmall = width < guide.minimumWidth || height < guide.minimumHeight;
  if (isTooSmall) {
    return {
      width,
      height,
      isPerfect: false,
      shouldBlock: true,
      message: `${guide.label}: ${formatSize(width, height)} is too small. Use at least ${formatSize(
        guide.minimumWidth,
        guide.minimumHeight
      )}.`
    };
  }

  const currentRatio = width / height;
  const recommendedRatio = guide.recommendedWidth / guide.recommendedHeight;
  const aspectDiffRatio = Math.abs(currentRatio - recommendedRatio) / recommendedRatio;
  const aspectMatches = aspectDiffRatio <= MAX_ASPECT_DIFF_RATIO;

  if (guide.strictAspect && !aspectMatches) {
    return {
      width,
      height,
      isPerfect: false,
      shouldBlock: true,
      message: `${guide.label}: ${formatSize(width, height)} aspect ratio does not match recommended ${formatSize(
        guide.recommendedWidth,
        guide.recommendedHeight
      )}.`
    };
  }

  if (isPerfect) {
    return {
      width,
      height,
      isPerfect: true,
      shouldBlock: false,
      message: `${guide.label}: perfect size (${formatSize(width, height)}).`
    };
  }

  if (!aspectMatches) {
    return {
      width,
      height,
      isPerfect: false,
      shouldBlock: false,
      message: `${guide.label}: ${formatSize(width, height)} uploaded. Recommended ${formatSize(
        guide.recommendedWidth,
        guide.recommendedHeight
      )} for best fit.`
    };
  }

  return {
    width,
    height,
    isPerfect: false,
    shouldBlock: false,
    message: `${guide.label}: good size (${formatSize(width, height)}). Recommended ${formatSize(
      guide.recommendedWidth,
      guide.recommendedHeight
    )}.`
  };
};

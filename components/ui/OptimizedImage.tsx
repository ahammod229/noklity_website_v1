import React from 'react';
import { buildResponsiveSrcSet, buildSupabaseTransformedUrl } from '../../utils/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  responsiveWidths?: number[];
  sizes?: string;
  quality?: number;
  useWebp?: boolean;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  responsiveWidths = [320, 480, 640, 768, 960, 1200],
  sizes = '100vw',
  quality = 80,
  useWebp = true,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}) => {
  const transformedSrc = buildSupabaseTransformedUrl(src, {
    width: Math.max(...responsiveWidths),
    quality,
    format: useWebp ? 'webp' : 'origin'
  });

  const srcSet = buildResponsiveSrcSet(src, responsiveWidths);

  return (
    <img
      src={transformedSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={loading}
      decoding={decoding}
      {...rest}
    />
  );
};

export default OptimizedImage;

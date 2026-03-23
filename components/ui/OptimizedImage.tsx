import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildResponsivePictureSources,
  DEFAULT_RESPONSIVE_IMAGE_WIDTHS
} from '../../utils/imageOptimization';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  responsiveWidths?: number[];
  sizes?: string;
  quality?: number;
  useWebp?: boolean;
}

const DEFAULT_PLACEHOLDER_SRC = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f8fafc"/>
    <rect x="160" y="160" width="480" height="480" rx="48" fill="#e5e7eb"/>
  </svg>
`)}`;

const preloadedImages = new Map<string, true | Promise<void>>();

const preloadImage = (src: string) => {
  if (!src || src.startsWith('data:') || typeof window === 'undefined') {
    return;
  }

  const existing = preloadedImages.get(src);
  if (existing === true) return;
  if (existing) throw existing;

  const promise = new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => {
      preloadedImages.set(src, true);
      resolve();
    };
    image.onerror = () => {
      preloadedImages.delete(src);
      resolve();
    };
    image.src = src;
  });

  preloadedImages.set(src, promise);
  throw promise;
};

type RenderStage = 'full' | 'no-avif' | 'no-webp' | 'fallback';

interface OptimizedImageRendererProps extends OptimizedImageProps {
  renderStage: RenderStage;
  isLoaded: boolean;
  onLoad: React.ReactEventHandler<HTMLImageElement>;
  onError: React.ReactEventHandler<HTMLImageElement>;
  placeholderOnly?: boolean;
}

const OptimizedImageRenderer: React.FC<OptimizedImageRendererProps> = ({
  src,
  alt,
  renderStage,
  isLoaded,
  responsiveWidths = [...DEFAULT_RESPONSIVE_IMAGE_WIDTHS],
  sizes = '100vw',
  quality,
  useWebp = true,
  loading = 'lazy',
  decoding = 'async',
  className,
  style,
  width,
  height,
  onLoad,
  onError,
  placeholderOnly = false,
  ...rest
}) => {
  void quality;
  const imageRef = useRef<HTMLImageElement | null>(null);

  const responsiveSources = useMemo(
    () => buildResponsivePictureSources(src || '', { widths: responsiveWidths }),
    [src, responsiveWidths]
  );

  const showResponsiveSources = useWebp !== false && !placeholderOnly;
  const resolvedFallbackSrc =
    renderStage === 'fallback'
      ? DEFAULT_PLACEHOLDER_SRC
      : responsiveSources.fallbackSrc || src || DEFAULT_PLACEHOLDER_SRC;
  const resolvedPlaceholderSrc =
    responsiveSources.placeholderSrc || resolvedFallbackSrc || DEFAULT_PLACEHOLDER_SRC;
  const resolvedWidth = typeof width === 'number' ? width : width ? Number(width) : undefined;
  const resolvedHeight =
    typeof height === 'number'
      ? height
      : height
        ? Number(height)
        : resolvedWidth;

  const loadingClassName = placeholderOnly || isLoaded ? '' : ' blur-[10px] scale-[1.02]';

  useEffect(() => {
    const image = imageRef.current;
    if (!image || placeholderOnly || isLoaded) {
      return;
    }

    if (image.complete && image.naturalWidth > 0) {
      const syntheticEvent = {
        currentTarget: image,
        target: image
      } as unknown as React.SyntheticEvent<HTMLImageElement>;
      onLoad(syntheticEvent);
    }
  }, [isLoaded, onLoad, placeholderOnly, renderStage, resolvedFallbackSrc]);

  const imageNode = (
    <img
      ref={imageRef}
      src={resolvedFallbackSrc}
      srcSet={
        !placeholderOnly && renderStage !== 'fallback' ? responsiveSources.fallbackSrcSet : undefined
      }
      sizes={placeholderOnly ? undefined : sizes}
      alt={alt}
      loading={loading}
      decoding={decoding}
      width={resolvedWidth}
      height={resolvedHeight}
      onLoad={onLoad}
      onError={onError}
      className={`${className || ''}${loadingClassName}`.trim()}
      style={{
        backgroundColor: '#f8fafc',
        backgroundImage: !placeholderOnly && !isLoaded ? `url("${resolvedPlaceholderSrc}")` : undefined,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        ...style
      }}
      {...rest}
    />
  );

  if (placeholderOnly || responsiveSources.isVector || renderStage === 'fallback' || !showResponsiveSources) {
    return imageNode;
  }

  return (
    <picture>
      {renderStage === 'full' && responsiveSources.avifSrcSet ? (
        <source srcSet={responsiveSources.avifSrcSet} sizes={sizes} type="image/avif" />
      ) : null}
      {(renderStage === 'full' || renderStage === 'no-avif') && responsiveSources.webpSrcSet ? (
        <source srcSet={responsiveSources.webpSrcSet} sizes={sizes} type="image/webp" />
      ) : null}
      {imageNode}
    </picture>
  );
};

interface SuspenseImageProps extends OptimizedImageRendererProps {
  suspenseSrc: string;
}

const SuspenseImage: React.FC<SuspenseImageProps> = ({ suspenseSrc, ...props }) => {
  preloadImage(suspenseSrc);
  return <OptimizedImageRenderer {...props} />;
};

const OptimizedImage: React.FC<OptimizedImageProps> = (props) => {
  const { src, loading = 'lazy', ...rest } = props;
  const [renderStage, setRenderStage] = useState<RenderStage>('full');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setRenderStage('full');
    setIsLoaded(false);
  }, [src]);

  const responsiveSources = useMemo(
    () => buildResponsivePictureSources(src || '', { widths: props.responsiveWidths }),
    [props.responsiveWidths, src]
  );

  const suspenseSrc = responsiveSources.placeholderSrc || responsiveSources.fallbackSrc || src;
  const shouldUseSuspense = loading !== 'lazy' && Boolean(suspenseSrc);

  const handleLoad: React.ReactEventHandler<HTMLImageElement> = (event) => {
    setIsLoaded(true);
    props.onLoad?.(event);
  };

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    if (renderStage === 'full' && responsiveSources.avifSrcSet) {
      setRenderStage('no-avif');
      return;
    }

    if ((renderStage === 'full' || renderStage === 'no-avif') && responsiveSources.webpSrcSet) {
      setRenderStage('no-webp');
      return;
    }

    if (renderStage !== 'fallback') {
      setRenderStage('fallback');
      return;
    }

    props.onError?.(event);
  };

  const rendererProps: OptimizedImageRendererProps = {
    ...rest,
    src,
    loading,
    renderStage,
    isLoaded,
    onLoad: handleLoad,
    onError: handleError
  };

  if (!shouldUseSuspense) {
    return <OptimizedImageRenderer {...rendererProps} />;
  }

  return (
    <Suspense
      fallback={
        <OptimizedImageRenderer
          {...rendererProps}
          placeholderOnly
          renderStage="fallback"
        />
      }
    >
      <SuspenseImage
        {...rendererProps}
        suspenseSrc={suspenseSrc}
      />
    </Suspense>
  );
};

export default OptimizedImage;

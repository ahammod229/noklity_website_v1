import React, { useEffect, useRef, useState } from 'react';

interface ProgressiveImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'children'> {
  src: string;
  alt: string;
  placeholderSrc: string;
  rootMargin?: string;
  loadedClassName?: string;
  loadingClassName?: string;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholderSrc,
  rootMargin = '200px',
  className = '',
  loadedClassName = '',
  loadingClassName = '',
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  srcSet,
  sizes,
  ...imageProps
}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [shouldLoadHighRes, setShouldLoadHighRes] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);
  const [isHighResLoaded, setIsHighResLoaded] = useState(!placeholderSrc || placeholderSrc === src);

  useEffect(() => {
    setShouldLoadHighRes(false);
    setCurrentSrc(placeholderSrc || src);
    setIsHighResLoaded(!placeholderSrc || placeholderSrc === src);
  }, [placeholderSrc, src]);

  useEffect(() => {
    if (shouldLoadHighRes) return;

    const imageElement = imageRef.current;
    if (!imageElement) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadHighRes(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoadHighRes(true);
        observer.disconnect();
      },
      {
        rootMargin,
        threshold: 0.01
      }
    );

    observer.observe(imageElement);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, shouldLoadHighRes]);

  useEffect(() => {
    if (!shouldLoadHighRes || !src) return;
    setCurrentSrc(src);
  }, [shouldLoadHighRes, src]);

  const handleLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (currentSrc === src) {
      setIsHighResLoaded(true);
    }

    onLoad?.(event);
  };

  return (
    <img
      {...imageProps}
      ref={imageRef}
      src={currentSrc}
      srcSet={shouldLoadHighRes ? srcSet : undefined}
      sizes={shouldLoadHighRes ? sizes : undefined}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onLoad={handleLoad}
      className={[
        'transition-[filter,opacity,transform] duration-500 ease-out will-change-[filter,opacity,transform]',
        isHighResLoaded ? 'blur-0 opacity-100 scale-100' : 'blur-md opacity-95 scale-[1.01]',
        isHighResLoaded ? loadedClassName : loadingClassName,
        className
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
};

export default ProgressiveImage;

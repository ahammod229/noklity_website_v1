
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import OptimizedImage from './ui/OptimizedImage';

interface ProductImageGalleryProps {
  mainImage: string;
  images?: string[];
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ mainImage, images = [], productName }) => {
  const { theme } = useTheme();
  const uniqueImages = Array.from(new Set([mainImage, ...images].filter(Boolean)));
  const galleryImages = uniqueImages.length > 0 ? uniqueImages : [mainImage];

  const [activeImage, setActiveImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setCursorPos({ x, y });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Area */}
      <div
        className="product-image-surface relative w-full aspect-square rounded-lg overflow-hidden border border-gray-100 group cursor-crosshair"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <OptimizedImage
          src={galleryImages[activeImage]}
          alt={productName}
          width={960}
          responsiveWidths={[320, 480, 640, 768, 960, 1200]}
          quality={84}
          loading="eager"
          className={`w-full h-full object-contain transition-transform duration-200 ${
            theme === 'dark' ? 'mix-blend-normal' : 'mix-blend-multiply'
          } ${isHovered ? 'scale-150' : 'scale-100'}`}
          style={{
            transformOrigin: isHovered ? `${cursorPos.x}% ${cursorPos.y}%` : 'center center'
          }}
        />
        {!isHovered && (
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-2 py-1 text-[10px] font-bold text-gray-500 rounded uppercase tracking-wider pointer-events-none">
            Roll over to Zoom
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {galleryImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(idx)}
            className={`product-image-thumb-surface w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
              activeImage === idx 
              ? 'border-primary ring-1 ring-primary/20' 
              : 'border-transparent hover:border-gray-200'
            }`}
          >
            <OptimizedImage
              src={img}
              alt={`View ${idx + 1}`}
              width={160}
              responsiveWidths={[96, 128, 160, 192]}
              quality={80}
              className={`w-full h-full object-contain p-1 ${
                theme === 'dark' ? 'mix-blend-normal' : 'mix-blend-multiply'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;

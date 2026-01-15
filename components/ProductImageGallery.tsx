
import React, { useState } from 'react';

interface ProductImageGalleryProps {
  mainImage: string;
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ mainImage, productName }) => {
  // Mocking multiple images for the gallery effect
  const images = [
    mainImage,
    mainImage, // In a real app, these would be different angles
    mainImage,
    mainImage
  ];

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
        className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group cursor-crosshair"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <img 
          src={images[activeImage]} 
          alt={productName}
          className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-200 ${isHovered ? 'scale-150' : 'scale-100'}`}
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
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImage(idx)}
            className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-50 rounded-lg border-2 overflow-hidden transition-all ${
              activeImage === idx 
              ? 'border-primary ring-1 ring-primary/20' 
              : 'border-transparent hover:border-gray-200'
            }`}
          >
            <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-contain mix-blend-multiply p-1" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductImageGallery;

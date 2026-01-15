import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  label: string;
  currentImage?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  aspectRatio?: string;
  helperText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  currentImage, 
  onUpload, 
  onRemove,
  aspectRatio = "aspect-video",
  helperText = "PNG, JPG or SVG up to 2MB"
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  const processUpload = async (file: File) => {
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processUpload(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
      
      {currentImage ? (
        <div className={`relative group rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden ${aspectRatio}`}>
          <img src={currentImage} alt="Preview" className="w-full h-full object-contain p-4" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-white text-gray-900 rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Replace Image"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button 
              onClick={onRemove}
              className="p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
              title="Remove Image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`
            relative cursor-pointer border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all
            ${isDragging ? 'border-primary bg-red-50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'}
            ${aspectRatio}
          `}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Click or drag to upload</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{helperText}</p>
            </>
          )}
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

export default ImageUploader;

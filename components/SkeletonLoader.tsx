import React from 'react';

export const SkeletonProductCard: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col h-full relative">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10 animate-[shimmer_1.5s_infinite] translate-x-[-100%]" />
      
      <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
      <div className="p-5 flex flex-col flex-grow space-y-4">
        <div className="flex gap-2">
            <div className="h-3 bg-gray-100 rounded-full w-12 animate-pulse" />
            <div className="h-3 bg-gray-100 rounded-full w-20 animate-pulse" />
        </div>
        <div className="h-6 bg-gray-100 rounded-lg w-3/4 animate-pulse" />
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-10 animate-pulse" />
            <div className="h-7 bg-gray-100 rounded w-24 animate-pulse" />
          </div>
          <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
};
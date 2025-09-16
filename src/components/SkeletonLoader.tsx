import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  className = '', 
  count = 1, 
  height = 'h-4', 
  width = 'w-full' 
}) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-slate-700 rounded ${height} ${width} ${className}`}
        />
      ))}
    </>
  );
};

export const ItemSkeleton: React.FC<{ viewMode?: 'grid' | 'list' }> = ({ viewMode = 'list' }) => {
  if (viewMode === 'grid') {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4">
        <div className="flex items-start gap-4">
          <SkeletonLoader className="w-16 h-16 rounded-lg" count={1} />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-5 w-3/4" count={1} />
            <SkeletonLoader className="h-4 w-1/2" count={1} />
            <SkeletonLoader className="h-4 w-2/3" count={1} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <SkeletonLoader className="h-8 w-20" count={1} />
          <SkeletonLoader className="h-8 w-20" count={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-4">
        <SkeletonLoader className="w-12 h-12 rounded-lg" count={1} />
        <div className="flex-1 space-y-2">
          <SkeletonLoader className="h-6 w-1/3" count={1} />
          <SkeletonLoader className="h-4 w-1/4" count={1} />
        </div>
        <div className="flex gap-2">
          <SkeletonLoader className="h-10 w-24" count={1} />
          <SkeletonLoader className="h-10 w-24" count={1} />
        </div>
      </div>
    </div>
  );
};

export const StatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <SkeletonLoader className="h-4 w-20" count={1} />
              <SkeletonLoader className="h-8 w-16" count={1} />
            </div>
            <SkeletonLoader className="w-12 h-12 rounded-lg" count={1} />
          </div>
        </div>
      ))}
    </div>
  );
};

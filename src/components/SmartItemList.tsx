import React, { useState, useEffect } from 'react';
import { Poe2Item } from '../services/types';
import { VirtualItemList } from './VirtualItemList';
import { ViewModeToggle } from './ViewModeToggle';
import { ItemSkeleton } from './SkeletonLoader';

interface SmartItemListProps {
  items: Poe2Item[];
  onPriceClick?: (item: Poe2Item) => void;
  onRefreshClick?: (item: Poe2Item) => void;
  priceEstimates: Record<string, any>;
  selectedLeague: string;
  isLoading?: boolean;
  className?: string;
}

export const SmartItemList: React.FC<SmartItemListProps> = ({
  items,
  onPriceClick,
  onRefreshClick,
  priceEstimates,
  selectedLeague,
  isLoading = false,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('preferredViewMode') as 'grid' | 'list' | null;
    
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('preferredViewMode', viewMode);
  }, [viewMode]);

  // Handle view mode change with smooth transition
  const handleViewModeChange = (newMode: 'grid' | 'list') => {
    if (newMode !== viewMode) {
      setIsTransitioning(true);
      setViewMode(newMode);
      
      // Reset transition state after animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };


  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">Loading Items...</h2>
          </div>
          <ViewModeToggle
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            itemCount={0}
          />
        </div>
        
        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4' : 'space-y-4'}`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <ItemSkeleton key={index} viewMode={viewMode} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-16">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-12">
            <div className="text-6xl mb-6">📦</div>
            <h3 className="text-2xl font-semibold text-white mb-3">No items found</h3>
            <p className="text-slate-400 text-lg">Try adjusting your search or filter criteria</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">
            {items.length} {items.length === 1 ? 'Item' : 'Items'}
          </h2>
        </div>
        
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          itemCount={items.length}
        />
      </div>

      {/* Items container with transition */}
      <div 
        className={`transition-all duration-300 ${
          isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <VirtualItemList
          items={items}
          viewMode={viewMode}
          onPriceClick={onPriceClick}
          onRefreshClick={onRefreshClick}
          priceEstimates={priceEstimates}
          selectedLeague={selectedLeague}
          className="h-[600px]"
        />
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Poe2Item } from '../services/types';
import { PoeListItem } from './PoeListItem';

interface ImprovedVirtualizedListProps {
  items: Poe2Item[];
  viewMode: 'grid' | 'list';
  onPriceClick?: (item: Poe2Item) => void;
  onRefreshClick?: (item: Poe2Item) => void;
  priceEstimates: Record<string, any>;
  selectedLeague: string;
  className?: string;
}

interface VirtualItem {
  index: number;
  item: Poe2Item;
  top: number;
  height: number;
  left?: number;
  width?: number;
}

export const ImprovedVirtualizedList: React.FC<ImprovedVirtualizedListProps> = ({
  items,
  viewMode,
  onPriceClick,
  onRefreshClick,
  priceEstimates,
  selectedLeague,
  className = '',
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Responsive grid calculations
  const gridConfig = useMemo(() => {
    if (viewMode === 'grid') {
      const minItemWidth = 320; // Increased minimum width for grid items
      const gap = 16; // Reduced gap between items
      const itemsPerRow = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)));
      const itemWidth = Math.floor((containerWidth - (gap * (itemsPerRow - 1))) / itemsPerRow);
      const itemHeight = 280; // Fixed height for grid items
      
      return {
        itemsPerRow,
        itemWidth,
        itemHeight,
        gap,
      };
    } else {
      return {
        itemsPerRow: 1,
        itemWidth: containerWidth,
        itemHeight: 220, // Increased height for list items to prevent overlap
        gap: 0,
      };
    }
  }, [viewMode, containerWidth]);

  // Calculate virtual items with proper positioning
  const virtualItems = useMemo((): VirtualItem[] => {
    const virtualItemsList: VirtualItem[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const row = Math.floor(i / gridConfig.itemsPerRow);
      const col = i % gridConfig.itemsPerRow;
      
      // For list view, add proper spacing between items
      const itemSpacing = viewMode === 'list' ? 24 : gridConfig.gap; // 24px spacing for list items
      const top = row * (gridConfig.itemHeight + itemSpacing);
      const left = viewMode === 'grid' ? col * (gridConfig.itemWidth + gridConfig.gap) : 0;
      
      virtualItemsList.push({
        index: i,
        item: items[i],
        top,
        height: gridConfig.itemHeight,
        left,
        width: gridConfig.itemWidth,
      });
    }
    
    return virtualItemsList;
  }, [items, gridConfig, viewMode]);

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const overscan = 3; // Render 3 extra items above and below
    const itemSpacing = viewMode === 'list' ? 24 : gridConfig.gap;
    const itemHeight = gridConfig.itemHeight + itemSpacing;
    
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(
      virtualItems.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { start, end };
  }, [scrollTop, containerHeight, gridConfig, virtualItems.length, viewMode]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const visible: VirtualItem[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (virtualItems[i]) {
        visible.push(virtualItems[i]);
      }
    }
    
    return visible;
  }, [visibleRange, virtualItems]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    const totalRows = Math.ceil(items.length / gridConfig.itemsPerRow);
    const itemSpacing = viewMode === 'list' ? 24 : gridConfig.gap;
    return totalRows * (gridConfig.itemHeight + itemSpacing) - itemSpacing;
  }, [items.length, gridConfig, viewMode]);

  // Smooth scroll handling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set new timeout to detect scroll end
    const timeout = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    setScrollTimeout(timeout);
  }, [scrollTimeout]);

  // Handle resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
      setContainerHeight(rect.height);
    }
  }, []);

  // Set up resize observer and initial measurements
  useEffect(() => {
    if (containerRef.current) {
      handleResize();
      
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
      
      return () => {
        resizeObserver.disconnect();
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
      };
    }
  }, [handleResize, scrollTimeout]);

  // Handle window resize
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Scroll to top when items change
  useEffect(() => {
    if (scrollElementRef.current) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [scrollTimeout]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
          <p className="text-slate-400">No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full ${className}`}
    >
      <div
        ref={scrollElementRef}
        className="w-full h-full overflow-auto scroll-smooth"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1e293b',
        }}
      >
        {/* Virtual container */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items */}
          {visibleItems.map((virtualItem) => {
            const { index, item, top, height, left, width } = virtualItem;
            
            return (
              <div
                key={`${item.id}-${index}`}
                className={`transition-all duration-200 ${isScrolling ? 'opacity-90' : 'opacity-100'}`}
                style={{
                  position: 'absolute',
                  top,
                  left: left || 0,
                  width: width || '100%',
                  height,
                  padding: viewMode === 'grid' ? '12px' : '0',
                }}
              >
                <div className="h-full">
                  <PoeListItem
                    item={item}
                    onPriceClick={onPriceClick}
                    onRefreshClick={onRefreshClick}
                    priceSuggestion={priceEstimates[item.id]?.price}
                    selectedLeague={selectedLeague}
                    viewMode={viewMode}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Scroll progress indicator */}
      {totalHeight > containerHeight && (
        <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 border border-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span>{Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%</span>
          </div>
        </div>
      )}
      
      {/* Items count indicator */}
      <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-300 border border-slate-600">
        <div className="flex items-center gap-2">
          <span>{items.length} items</span>
          <span className="text-slate-500">•</span>
          <span>{viewMode === 'grid' ? 'Grid' : 'List'} view</span>
        </div>
      </div>
    </div>
  );
};

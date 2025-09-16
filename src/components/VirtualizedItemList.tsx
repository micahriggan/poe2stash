import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Poe2Item } from '../services/types';
import { PoeListItem } from './PoeListItem';

interface VirtualizedItemListProps {
  items: Poe2Item[];
  viewMode: 'grid' | 'list';
  onPriceClick?: (item: Poe2Item) => void;
  onRefreshClick?: (item: Poe2Item) => void;
  priceEstimates: Record<string, any>;
  selectedLeague: string;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

interface VirtualItem {
  index: number;
  item: Poe2Item;
  top: number;
  height: number;
}

export const VirtualizedItemList: React.FC<VirtualizedItemListProps> = ({
  items,
  viewMode,
  onPriceClick,
  onRefreshClick,
  priceEstimates,
  selectedLeague,
  itemHeight = 120, // Default height for list view
  containerHeight = 600,
  overscan = 5,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate item dimensions based on view mode
  const itemDimensions = useMemo(() => {
    if (viewMode === 'grid') {
      // For grid view, calculate items per row based on container width
      const itemsPerRow = Math.max(1, Math.floor(containerWidth / 300)); // 300px per item
      const itemWidth = containerWidth / itemsPerRow;
      const itemHeightGrid = 200; // Fixed height for grid items
      
      return {
        width: itemWidth,
        height: itemHeightGrid,
        itemsPerRow,
      };
    } else {
      // For list view, use full width and specified height
      return {
        width: containerWidth,
        height: itemHeight,
        itemsPerRow: 1,
      };
    }
  }, [viewMode, containerWidth, itemHeight]);

  // Calculate virtual items
  const virtualItems = useMemo((): VirtualItem[] => {
    const virtualItemsList: VirtualItem[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const row = Math.floor(i / itemDimensions.itemsPerRow);
      const top = row * itemDimensions.height;
      
      virtualItemsList.push({
        index: i,
        item: items[i],
        top,
        height: itemDimensions.height,
      });
    }
    
    return virtualItemsList;
  }, [items, itemDimensions]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemDimensions.height) - overscan);
    const end = Math.min(
      virtualItems.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemDimensions.height) + overscan
    );
    
    return { start, end };
  }, [scrollTop, containerHeight, itemDimensions.height, virtualItems.length, overscan]);

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
    const totalRows = Math.ceil(items.length / itemDimensions.itemsPerRow);
    return totalRows * itemDimensions.height;
  }, [items.length, itemDimensions]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle resize
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  // Set up resize observer
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
      
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
      
      return () => resizeObserver.disconnect();
    }
  }, [handleResize]);

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

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-8">
          <p className="text-slate-400">No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full"
      style={{ height: containerHeight }}
    >
      <div
        ref={scrollElementRef}
        className="w-full h-full overflow-auto"
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
            const { index, item, top, height } = virtualItem;
            
            return (
              <div
                key={`${item.id}-${index}`}
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  width: '100%',
                  height,
                  padding: viewMode === 'grid' ? '8px' : '0',
                }}
              >
                {viewMode === 'grid' ? (
                  <div className="h-full">
                    <PoeListItem
                      item={item}
                      onPriceClick={onPriceClick}
                      onRefreshClick={onRefreshClick}
                      priceSuggestion={priceEstimates[item.id]?.price}
                      selectedLeague={selectedLeague}
                      viewMode="grid"
                    />
                  </div>
                ) : (
                  <PoeListItem
                    item={item}
                    onPriceClick={onPriceClick}
                    onRefreshClick={onRefreshClick}
                    priceSuggestion={priceEstimates[item.id]?.price}
                    selectedLeague={selectedLeague}
                    viewMode="list"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Scroll indicator */}
      {totalHeight > containerHeight && (
        <div className="absolute bottom-4 right-4 bg-slate-800/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-slate-300">
          {Math.round((scrollTop / (totalHeight - containerHeight)) * 100)}%
        </div>
      )}
    </div>
  );
};

// Hook for virtual scrolling with dynamic item heights
export const useVirtualScrolling = (
  items: any[],
  containerHeight: number,
  estimatedItemHeight: number = 120,
  overscan: number = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  const virtualItems = useMemo(() => {
    const items: Array<{ index: number; top: number; height: number }> = [];
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.get(i) || estimatedItemHeight;
      items.push({
        index: i,
        top: currentTop,
        height,
      });
      currentTop += height;
    }

    return items;
  }, [items.length, itemHeights, estimatedItemHeight]);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, virtualItems.findIndex(item => item.top + item.height >= scrollTop) - overscan);
    const end = Math.min(
      virtualItems.length - 1,
      virtualItems.findIndex(item => item.top >= scrollTop + containerHeight) + overscan
    );
    
    return { start, end };
  }, [scrollTop, containerHeight, virtualItems, overscan]);

  const visibleItems = useMemo(() => {
    return virtualItems.slice(visibleRange.start, visibleRange.end + 1);
  }, [visibleRange, virtualItems]);

  const totalHeight = useMemo(() => {
    return virtualItems.length > 0 
      ? virtualItems[virtualItems.length - 1].top + virtualItems[virtualItems.length - 1].height
      : 0;
  }, [virtualItems]);

  const updateItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newMap = new Map(prev);
      newMap.set(index, height);
      return newMap;
    });
  }, []);

  const handleScroll = useCallback((scrollTop: number) => {
    setScrollTop(scrollTop);
  }, []);

  return {
    virtualItems,
    visibleItems,
    totalHeight,
    updateItemHeight,
    handleScroll,
  };
};

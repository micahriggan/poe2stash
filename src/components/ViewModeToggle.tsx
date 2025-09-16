import React from 'react';
import { Grid, List } from 'lucide-react';

interface ViewModeToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  itemCount: number;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  itemCount,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* View Mode Toggle */}
      <div className="flex items-center bg-slate-700/50 rounded-lg p-1.5 border border-slate-600">
        <button
          onClick={() => onViewModeChange('list')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md transition-all duration-200 ${
            viewMode === 'list'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
          }`}
          title="List view - Detailed information"
        >
          <List size={18} />
          <span className="text-sm font-medium">List</span>
        </button>
        
        <button
          onClick={() => onViewModeChange('grid')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md transition-all duration-200 ${
            viewMode === 'grid'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
          }`}
          title="Grid view - Compact overview"
        >
          <Grid size={18} />
          <span className="text-sm font-medium">Grid</span>
        </button>
      </div>

      {/* Performance Indicator */}
      {itemCount > 50 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              itemCount > 200 ? 'bg-red-400' : 
              itemCount > 100 ? 'bg-yellow-400' : 
              'bg-green-400'
            }`}></div>
            <span className="text-sm text-slate-400 font-medium">
              {itemCount > 200 ? 'Heavy' : 
               itemCount > 100 ? 'Medium' : 
               'Light'} load
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Poe2Item } from '../services/types';
import { 
  RefreshCw, 
  DollarSign, 
  Copy, 
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ItemCardProps {
  item: Poe2Item;
  priceSuggestion?: { amount: number; currency: string };
  onPriceClick?: (item: Poe2Item) => void;
  onRefreshClick?: (item: Poe2Item) => void;
  selectedLeague?: string;
  viewMode?: 'grid' | 'list';
  className?: string;
}

type ActionState = 'idle' | 'loading' | 'success' | 'error';

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  priceSuggestion,
  onPriceClick,
  onRefreshClick,
  selectedLeague = "Rise of the Abyssal",
  viewMode = 'list',
  className = '',
}) => {
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({
    refresh: 'idle',
    priceCheck: 'idle',
    copy: 'idle',
    search: 'idle'
  });

  const getRarityColor = (rarity: string = "magic") => {
    switch (rarity.toLowerCase()) {
      case "normal": return "text-gray-200";
      case "magic": return "text-blue-300";
      case "rare": return "text-yellow-300";
      case "unique": return "text-orange-400";
      default: return "text-blue-300";
    }
  };

  const getButtonIcon = (action: string) => {
    const state = actionStates[action];
    switch (state) {
      case 'loading':
        return <Loader2 size={16} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        switch (action) {
          case 'refresh': return <RefreshCw size={16} />;
          case 'priceCheck': return <DollarSign size={16} />;
          case 'copy': return <Copy size={16} />;
          case 'search': return <ExternalLink size={16} />;
          default: return null;
        }
    }
  };

  const getButtonColor = (action: string) => {
    const state = actionStates[action];
    switch (state) {
      case 'loading': return 'bg-blue-500 cursor-not-allowed';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default:
        switch (action) {
          case 'refresh': return 'bg-blue-500 hover:bg-blue-600';
          case 'priceCheck': return 'bg-green-500 hover:bg-green-600';
          case 'copy': return 'bg-purple-500 hover:bg-purple-600';
          case 'search': return 'bg-orange-500 hover:bg-orange-600';
          default: return 'bg-gray-500 hover:bg-gray-600';
        }
    }
  };

  const handleAction = async (action: string, actionFn: () => Promise<void>) => {
    setActionStates(prev => ({ ...prev, [action]: 'loading' }));
    try {
      await actionFn();
      setActionStates(prev => ({ ...prev, [action]: 'success' }));
      setTimeout(() => setActionStates(prev => ({ ...prev, [action]: 'idle' })), 2000);
    } catch (error) {
      setActionStates(prev => ({ ...prev, [action]: 'error' }));
      setTimeout(() => setActionStates(prev => ({ ...prev, [action]: 'idle' })), 2000);
    }
  };

  const handleRefresh = () => handleAction('refresh', async () => {
    await onRefreshClick?.(item);
  });

  const handlePriceCheck = () => handleAction('priceCheck', async () => {
    await onPriceClick?.(item);
  });

  const handleCopy = () => handleAction('copy', async () => {
    await navigator.clipboard.writeText(item.item.name || item.item.typeLine);
  });

  const handleSearch = () => handleAction('search', async () => {
    // For now, just open a basic search - you can enhance this later
    window.open(`https://www.pathofexile.com/trade2/search/poe2/${selectedLeague}`, "_blank");
  });

  const ActionButton: React.FC<{
    action: string;
    onClick: () => void;
    title: string;
    size?: 'sm' | 'md';
  }> = ({ action, onClick, title, size = 'md' }) => (
    <button
      onClick={onClick}
      disabled={actionStates[action] === 'loading'}
      className={`${size === 'sm' ? 'p-2' : 'p-3'} rounded-lg transition-all duration-200 ${getButtonColor(action)} text-white disabled:opacity-50 hover:scale-105 active:scale-95`}
      title={title}
    >
      {getButtonIcon(action)}
    </button>
  );

  if (viewMode === 'grid') {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-4 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg h-full flex flex-col ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={item.item.icon} 
            alt={item.item.name} 
            className="w-10 h-10 rounded-lg border border-slate-600 flex-shrink-0" 
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm leading-tight truncate ${getRarityColor(item.item?.rarity)}`}>
              {item.item.name || item.item.typeLine}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {!item.item.name ? item.item.baseType : item.item.typeLine}
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="font-semibold text-green-400 text-sm">
            {item.listing.price.amount} {item.listing.price.currency}
          </div>
          {priceSuggestion && (
            <div className="text-xs text-orange-400">
              ~{Math.round(priceSuggestion.amount)} {priceSuggestion.currency}
            </div>
          )}
        </div>

        {/* Status */}
        {item.item.corrupted && (
          <div className="text-red-400 text-xs font-medium mb-2">Corrupted</div>
        )}

        {/* Mods */}
        <div className="flex-1 mb-3">
          {item.item.explicitMods && item.item.explicitMods.length > 0 && (
            <div className="space-y-1">
              {item.item.explicitMods.slice(0, 2).map((mod, index) => (
                <div key={index} className="text-xs text-slate-300 leading-tight line-clamp-1">
                  {mod}
                </div>
              ))}
              {item.item.explicitMods.length > 2 && (
                <div className="text-xs text-slate-500">+{item.item.explicitMods.length - 2} more...</div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <ActionButton action="refresh" onClick={handleRefresh} title="Refresh item data" size="sm" />
          <ActionButton action="priceCheck" onClick={handlePriceCheck} title="Check price" size="sm" />
          <ActionButton action="copy" onClick={handleCopy} title="Copy item name" size="sm" />
          <ActionButton action="search" onClick={handleSearch} title="Search on trade site" size="sm" />
        </div>

        {/* Stash info */}
        <div className="text-xs text-slate-500 pt-2 border-t border-slate-700 truncate">
          {item.listing.stash.name} ({item.listing.stash.x}, {item.listing.stash.y})
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 p-6 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-lg ${className}`}>
      <div className="flex gap-6">
        {/* Item Image */}
        <div className="flex-shrink-0">
          <img 
            src={item.item.icon} 
            alt={item.item.name} 
            className="w-20 h-20 rounded-lg border border-slate-600" 
          />
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-xl ${getRarityColor(item.item?.rarity)} truncate`}>
                {item.item.name || item.item.typeLine}
              </h2>
              <p className="text-slate-400 text-sm truncate">
                {!item.item.name ? item.item.baseType : item.item.typeLine}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="font-semibold text-green-400 text-xl">
                {item.listing.price.amount} {item.listing.price.currency}
              </div>
              {priceSuggestion && (
                <div className="text-orange-400 text-sm">
                  estimate: ~{Math.round(priceSuggestion.amount)} {priceSuggestion.currency}
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          {item.item.corrupted && (
            <div className="text-red-400 font-medium mb-3">Corrupted</div>
          )}

          {/* Mods */}
          <div className="space-y-3">
            {item.item.implicitMods && item.item.implicitMods.length > 0 && (
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2 text-sm">Implicit Mods:</h4>
                <ul className="space-y-1">
                  {item.item.implicitMods.map((mod, index) => (
                    <li key={index} className="text-blue-200 text-sm">{mod}</li>
                  ))}
                </ul>
              </div>
            )}

            {item.item.enchantMods && item.item.enchantMods.length > 0 && (
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-semibold text-purple-300 mb-2 text-sm">Enchant Mods:</h4>
                <ul className="space-y-1">
                  {item.item.enchantMods.map((mod, index) => (
                    <li key={index} className="text-purple-200 text-sm">{mod}</li>
                  ))}
                </ul>
              </div>
            )}

            {item.item.explicitMods && item.item.explicitMods.length > 0 && (
              <div className="bg-slate-700/50 p-3 rounded-lg">
                <h4 className="font-semibold text-slate-300 mb-2 text-sm">Explicit Mods:</h4>
                <ul className="space-y-1">
                  {item.item.explicitMods.map((mod, index) => (
                    <li key={index} className="text-slate-200 text-sm">{mod}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Stash info */}
          <div className="text-slate-500 text-sm mt-4 pt-3 border-t border-slate-700">
            Stash: {item.listing.stash.name} (x: {item.listing.stash.x}, y: {item.listing.stash.y})
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          <ActionButton action="refresh" onClick={handleRefresh} title="Refresh item data" />
          <ActionButton action="priceCheck" onClick={handlePriceCheck} title="Check price" />
          <ActionButton action="copy" onClick={handleCopy} title="Copy item name" />
          <ActionButton action="search" onClick={handleSearch} title="Search on trade site" />
        </div>
      </div>
    </div>
  );
};

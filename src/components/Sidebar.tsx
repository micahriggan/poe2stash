import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  BarChart3, 
  Settings, 
  History, 
  Activity,
  Home,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activePanel: string | null;
  onPanelChange: (panel: string | null) => void;
  children: React.ReactNode;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home size={20} />,
  },
  {
    id: 'analytics',
    label: 'Price Analytics',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: <Activity size={20} />,
  },
  {
    id: 'history',
    label: 'History',
    icon: <History size={20} />,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings size={20} />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  activePanel,
  onPanelChange,
  children,
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item: SidebarItem) => {
    if (item.children) {
      toggleExpanded(item.id);
    } else {
      onPanelChange(activePanel === item.id ? null : item.id);
    }
  };

  const renderSidebarItem = (item: SidebarItem, depth = 0) => {
    const isActive = activePanel === item.id;
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleItemClick(item)}
          className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-all duration-200 rounded-lg ${
            isActive
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-300 hover:bg-slate-700 hover:text-white'
          } ${depth > 0 ? 'ml-4' : ''}`}
        >
          <div className="flex-shrink-0">
            {item.icon}
          </div>
          <span className="flex-1 font-medium">{item.label}</span>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <div className="flex-shrink-0">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-slate-600">
            {item.children!.map(child => renderSidebarItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <div className={`${isOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-slate-800 border-r border-slate-700`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-xl font-bold text-white">POE2 Stash</h2>
              <p className="text-slate-400 text-sm">Trading Assistant</p>
            </div>
            <button
              onClick={onToggle}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="space-y-2 px-4">
              {sidebarItems.map(item => renderSidebarItem(item))}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-6 border-t border-slate-700">
            <div className="text-xs text-slate-400 text-center">
              v0.0.3 • POE2 Trading Assistant
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-slate-800 border-b border-slate-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onToggle}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {activePanel ? sidebarItems.find(item => item.id === activePanel)?.label : 'Dashboard'}
                </h1>
                <p className="text-slate-400 text-sm">
                  {activePanel === 'dashboard' ? 'Overview of your POE2 stash and trading' : 
                   activePanel === 'analytics' ? 'Price checking performance and insights' :
                   activePanel === 'performance' ? 'Application performance monitoring' :
                   activePanel === 'settings' ? 'Configure price checking behavior' :
                   activePanel === 'history' ? 'Complete price check history' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-400">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

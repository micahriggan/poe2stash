import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MainPageContent } from './MainPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { SettingsPage } from './pages/SettingsPage';
import { HistoryPage } from './pages/HistoryPage';

export const MainLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentPanel = () => {
    const path = location.pathname;
    if (path === '/analytics') return 'analytics';
    if (path === '/performance') return 'performance';
    if (path === '/settings') return 'settings';
    if (path === '/history') return 'history';
    return 'dashboard';
  };

  const handlePanelChange = (panel: string | null) => {
    if (panel === 'dashboard' || panel === null) {
      navigate('/');
    } else {
      navigate(`/${panel}`);
    }
  };

  return (
    <Sidebar
      isOpen={sidebarOpen}
      onToggle={() => setSidebarOpen(!sidebarOpen)}
      activePanel={getCurrentPanel()}
      onPanelChange={handlePanelChange}
    >
      <Routes>
        <Route path="/" element={<MainPageContent />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/performance" element={<PerformancePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Sidebar>
  );
};

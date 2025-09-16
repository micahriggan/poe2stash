import React from "react";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import { MainLayout } from "./components/MainLayout";
import MessagesPage from "./components/MessagesPage";
import { AppContextProvider } from "./contexts/AppContext";
import "./App.css";

const AppContent: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<MainLayout />} />
      <Route path="/messages" element={<MessagesPage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <Router>
        <AppContent />
      </Router>
    </AppContextProvider>
  );
};

export default App;

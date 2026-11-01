import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';

import { OverviewPage } from './pages/OverviewPage';
import { DatasetPage } from './pages/DatasetPage';
import { CleaningPage } from './pages/CleaningPage';
import { EDAPage } from './pages/EDAPage';
import { ModelTrainingPage } from './pages/ModelTrainingPage';
import { ForecastPage } from './pages/ForecastPage';
import { InventoryPage } from './pages/InventoryPage';
import { BusinessIntelligencePage } from './pages/BusinessIntelligencePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const PageRenderer = () => {
  const { activePage } = useApp();

  const renderCurrentPage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage />;
      case 'dataset':
        return <DatasetPage />;
      case 'cleaning':
        return <CleaningPage />;
      case 'eda':
        return <EDAPage />;
      case 'models':
        return <ModelTrainingPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'insights':
        return <BusinessIntelligencePage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activePage}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="w-full max-w-7xl mx-auto"
      >
        {renderCurrentPage()}
      </motion.div>
    </AnimatePresence>
  );
};

export function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b14] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <PageRenderer />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Theme state (persistent in localStorage, default dark for premium SaaS feel)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('retailiq_theme') || 'dark';
  });

  // Active navigation page
  const [activePage, setActivePage] = useState('overview');

  // Global search input in top bar
  const [globalSearch, setGlobalSearch] = useState('');

  // Dataset & model status from backend
  const [datasetStatus, setDatasetStatus] = useState({
    has_raw: false,
    raw_rows: 0,
    has_clean: false,
    clean_rows: 0,
    has_features: false,
    feature_rows: 0,
    has_model: false,
    best_model: null,
  });

  // Notifications drawer items
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Model Ready',
      desc: 'LightGBM trained with 99.9% R² score & low RMSE.',
      type: 'success',
      time: 'Just now'
    },
    {
      id: 2,
      title: 'Inventory Alert',
      desc: 'Stockout risk detected for high-demand products at Store S01.',
      type: 'warning',
      time: '10m ago'
    }
  ]);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('retailiq_theme', next);
      return next;
    });
  };

  // Sync dark class on document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load dataset status
  const refreshDatasetStatus = async () => {
    try {
      const status = await api.getDatasetStatus();
      setDatasetStatus(status);
    } catch (err) {
      console.warn('Could not fetch dataset status:', err);
    }
  };

  useEffect(() => {
    refreshDatasetStatus();
  }, []);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activePage,
        setActivePage,
        globalSearch,
        setGlobalSearch,
        datasetStatus,
        refreshDatasetStatus,
        notifications,
        setNotifications,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);

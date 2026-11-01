/**
 * api.js
 * Centralized API client service for communicating with FastAPI backend.
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let errMessage = `Error ${res.status}: ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) errMessage = errJson.detail;
      } catch (_) {}
      throw new Error(errMessage);
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

export const api = {
  // --- Dataset ---
  getDatasetStatus: () => request('/dataset/status'),
  getDatasetPreview: (page = 1, limit = 25, search = '', datasetType = 'raw') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      dataset_type: datasetType
    });
    if (search) params.append('search', search);
    return request(`/dataset/preview?${params.toString()}`);
  },
  getDatasetStats: (datasetType = 'raw') => request(`/dataset/stats?dataset_type=${datasetType}`),
  uploadDataset: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/dataset/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  loadSampleDataset: (sampleName = 'sample_2023_2024') => 
    request(`/dataset/sample?sample_name=${sampleName}`, { method: 'POST' }),
  getDatasetDownloadUrl: (datasetType = 'raw') => `${API_BASE}/dataset/download?dataset_type=${datasetType}`,

  // --- Cleaning ---
  getCleaningAnalysis: () => request('/cleaning/analysis'),
  runCleaning: (config = {}) => 
    request('/cleaning/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }),

  // --- EDA ---
  getEDAFilters: () => request('/eda/filters'),
  getEDACharts: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    return request(`/eda/charts?${params.toString()}`);
  },

  // --- Executive Overview ---
  getOverviewMetrics: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    return request(`/overview/metrics?${params.toString()}`);
  },

  // --- ML Models ---
  getModelComparison: () => request('/models/comparison'),
  getTrainingStatus: () => request('/models/status'),
  trainAllModels: () => request('/models/train', { method: 'POST' }),
  getFeatureImportance: () => request('/models/feature_importance'),

  // --- Forecasting ---
  getForecastOptions: () => request('/forecast/options'),
  generateForecast: (productId, storeId, horizon) => {
    const params = new URLSearchParams({
      product_id: productId,
      store_id: storeId,
      horizon: horizon
    });
    return request(`/forecast/generate?${params.toString()}`);
  },
  getForecastDownloadUrl: (productId, storeId, horizon) => 
    `${API_BASE}/forecast/download?product_id=${productId}&store_id=${storeId}&horizon=${encodeURIComponent(horizon)}`,

  // --- Inventory Engine ---
  getInventoryRecommendations: (leadTime = 7, serviceLevel = 0.95, filterAlert = '', search = '') => {
    const params = new URLSearchParams({
      lead_time_days: leadTime.toString(),
      service_level: serviceLevel.toString()
    });
    if (filterAlert && filterAlert !== 'ALL') params.append('filter_alert', filterAlert);
    if (search) params.append('search', search);
    return request(`/inventory/recommendations?${params.toString()}`);
  },
  getInventoryDownloadUrl: (leadTime = 7, serviceLevel = 0.95) => 
    `${API_BASE}/inventory/download?lead_time_days=${leadTime}&service_level=${serviceLevel}`,

  // --- Business Intelligence ---
  getBusinessInsights: () => request('/insights/summary'),

  // --- Reports ---
  getReportsList: () => request('/reports/list'),
  getReportExportUrl: (reportType, format = 'pdf') => 
    `${API_BASE}/reports/export?report_type=${reportType}&format=${format}`,

  // --- Settings ---
  getSettings: () => request('/settings/config'),
  updateSettings: (data) => request('/settings/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
};

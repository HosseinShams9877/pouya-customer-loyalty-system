// ============================================================================
// API Client - نسخه پیش‌نمایش با Mock Fallback
// ============================================================================

import axios from 'axios';
import { getMockResponse } from './mockData';
import { createDemoAdapter } from '../lib/demo-adapter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Demo Mode — مستقیم از mock adapter استفاده می‌شود بدون انتظار timeout ---
if (IS_DEMO) {
  api.defaults.adapter = createDemoAdapter(getMockResponse);
}

// --- Request: add token ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(config.memberAuth ? 'member_access_token' : 'access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (e) => Promise.reject(e));

// --- Response: unwrap + mock fallback ---
api.interceptors.response.use(
  (response) => {
    // اگر responseType === blob → مستقیماً برگردان (بدون unwrap)
    if (response.config?.responseType === 'blob') return response;
    const payload = response.data;
    // Legacy list routes return { data: [], pagination }. Normalize once here.
    if (Array.isArray(payload?.data) && payload?.pagination) {
      return { ...payload, data: { items: payload.data, pagination: payload.pagination } };
    }
    return payload;
  },
  async (error) => {
    // اگر responseType blob است → mock پیغام نمایش بده
    if (error.config?.responseType === 'blob') {
      const mock = getMockResponse(error.config?.url, error.config?.method);
      if (mock?._blob) {
        return { data: null, _mockBlobMessage: mock._message, isMock: true };
      }
    }
    // اگر بک‌اند در دسترس نیست → mock data برگردان
    if (IS_DEMO && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response)) {
      const mock = getMockResponse(error.config?.url, error.config?.method);
      if (mock) return mock;
    }
    // 401 → redirect
    if (error.response?.status === 401) {
      if (error.config?.memberAuth) {
        localStorage.removeItem('member_access_token');
        if (window.location.pathname !== '/club/login') window.location.href = '/club/login';
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
      }
    }
    const msg = error.response?.data?.error?.detail || error.response?.data?.message || error.message || 'خطای ناشناخته';
    return Promise.reject({ ...error, message: msg });
  }
);

// === Services ===
export const authService = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout', { refresh_token: localStorage.getItem('refresh_token') }),
  me: () => api.get('/auth/me'),
};

export const loyaltyAdminService = {
  getDashboard: () => api.get('/loyalty/dashboard'),
  getTiers: () => api.get('/loyalty/tiers'),
  createTier: (data) => api.post('/loyalty/tiers', data),
  updateTier: (id, data) => api.patch(`/loyalty/tiers/${id}`, data),
  getRules: () => api.get('/loyalty/rules'),
  createRule: (data) => api.post('/loyalty/rules', data),
  updateRule: (id, data) => api.patch(`/loyalty/rules/${id}`, data),
  getRewards: (params = {}) => api.get('/loyalty/rewards', { params }),
  createReward: (data) => api.post('/loyalty/rewards', data),
  updateReward: (id, data) => api.patch(`/loyalty/rewards/${id}`, data),
  getRedemptions: (params = {}) => api.get('/loyalty/redemptions', { params }),
  updateRedemption: (id, data) => api.patch(`/loyalty/redemptions/${id}/status`, data),
  getMissions: () => api.get('/loyalty/missions'),
  createMission: (data) => api.post('/loyalty/missions', data),
  updateMission: (id, data) => api.patch(`/loyalty/missions/${id}`, data),
  getSegments: () => api.get('/loyalty/segments'),
  createSegment: (data) => api.post('/loyalty/segments', data),
  getTransactions: (params = {}) => api.get('/loyalty/transactions', { params }),
  getOffers: () => api.get('/loyalty/offers'),
};

export const memberService = {
  requestOtp: (mobile) => api.post('/member/auth/request-otp', { mobile }, { memberAuth: true }),
  verifyOtp: (mobile, code) => api.post('/member/auth/verify-otp', { mobile, code }, { memberAuth: true }),
  me: () => api.get('/member/me', { memberAuth: true }),
  transactions: () => api.get('/member/transactions', { memberAuth: true }),
  convertPoints: (points) => api.post('/member/wallet/convert', { points }, { memberAuth: true }),
  rewards: () => api.get('/member/rewards', { memberAuth: true }),
  redeem: (id) => api.post(`/member/rewards/${id}/redeem`, {}, { memberAuth: true }),
  redemptions: () => api.get('/member/redemptions', { memberAuth: true }),
  missions: () => api.get('/member/missions', { memberAuth: true }),
  claimMission: (id) => api.post(`/member/missions/${id}/claim`, {}, { memberAuth: true }),
  referrals: () => api.get('/member/referrals', { memberAuth: true }),
  invite: (mobile) => api.post('/member/referrals', { mobile }, { memberAuth: true }),
  purchaseRequests: () => api.get('/member/purchase-requests', { memberAuth: true }),
  createPurchaseRequest: (data) => api.post('/member/purchase-requests', data, { memberAuth: true }),
};

export const businessService = {
  dashboard: () => api.get('/business/dashboard'),
  products: () => api.get('/business/products'),
  createProduct: (data) => api.post('/business/products', data),
  priceRules: () => api.get('/business/price-rules'),
  createPriceRule: (data) => api.post('/business/price-rules', data),
  salesTargets: (params = {}) => api.get('/business/sales-targets', { params }),
  createSalesTarget: (data) => api.post('/business/sales-targets', data),
  contractors: (params = {}) => api.get('/business/contractors', { params }),
  purchaseRequests: (params = {}) => api.get('/business/purchase-requests', { params }),
  updatePurchaseRequest: (id, data) => api.patch(`/business/purchase-requests/${id}`, data),
  shipments: () => api.get('/business/shipments'),
  createShipment: (data) => api.post('/business/shipments', data),
  duplicateCandidates: () => api.get('/business/data-quality/duplicates'),
  createMergeRequest: (data) => api.post('/business/data-quality/merge-requests', data),
};

export const leadService = {
  list: (params = {}) => api.get('/leads', { params }),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  updateStage: (id, data) => api.patch(`/leads/${id}/stage`, data),
  assign: (id, assignedToId) => api.patch(`/leads/${id}/assign`, { assignedToId }),
  getPipelineStats: () => api.get('/leads/stats/pipeline'),
};

export const interactionService = {
  listByLead: (leadId, params = {}) => api.get(`/interactions/leads/${leadId}`, { params }),
  create: (leadId, data) => api.post(`/interactions/leads/${leadId}`, data),
  listUpcoming: (params = {}) => api.get('/interactions/upcoming', { params }),
};

export const projectService = {
  list: (params = {}) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
};

export const customerService = {
  list: (params = {}) => api.get('/customers', { params }).catch(() => ({ data: { items: [] } })),
  getById: (id) => api.get(`/customers/${id}`).catch(() => ({ data: null })),
};

export const invoiceService = {
  list: (params = {}) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  getStats: () => api.get('/invoices/stats'),
};

export const loyaltyService = {
  getRules: () => api.get('/loyalty/rules'),
  getCustomerSummary: (id) => api.get(`/loyalty/customers/${id}/summary`),
  getCustomerBalance: (id) => api.get(`/loyalty/customers/${id}/balance`),
  getCustomerWallet: (id) => api.get(`/loyalty/customers/${id}/wallet`),
  getHistory: (id, params = {}) => api.get(`/loyalty/customers/${id}/history`, { params }),
  adjustPoints: (id, data) => api.post(`/loyalty/customers/${id}/adjust`, data),
};

export const churnService = {
  getRules: () => api.get('/churn/rules'),
  getReport: () => api.get('/churn/report'),
  runManually: () => api.post('/churn/run'),
  getReactivationWindow: (limit = 250) => api.get('/retention/reactivation', { params: { limit } }),
  createReactivationCampaign: (data = {}) => api.post('/retention/reactivation/campaign', data),
  markReactivated: (id) => api.post(`/retention/customers/${id}/reactivate`),
};

export const representativeService = {
  list: (params = {}) => api.get('/representatives', { params }),
  registrations: (params = {}) => api.get('/representatives/registrations', { params }),
  reviewRegistration: (id, data) => api.patch(`/representatives/registrations/${id}/review`, data),
  portal: () => api.get('/representatives/portal/me', { memberAuth: true }),
  registerProject: (data) => api.post('/representatives/portal/registrations', data, { memberAuth: true }),
};

export const feedbackService = {
  list: (params = {}) => api.get('/feedback', { params }),
  stats: () => api.get('/feedback/stats'),
  create: (data) => api.post('/feedback', data),
  update: (id, data) => api.patch(`/feedback/${id}`, data),
};

export const notificationService = {
  list: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  remove: (id) => api.delete(`/notifications/${id}`),
};

export const pushService = {
  getPublicKey: () => api.get('/notifications/push-public-key'),
  subscribe: (subscription) => api.post('/notifications/subscribe', subscription),
  unsubscribe: (endpoint) => api.delete('/notifications/subscribe', { data: { endpoint } }),
};

export const userService = {
  list: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  remove: (id) => api.delete(`/users/${id}`),
};

export const csatService = {
  getTokenInfo: (token) => api.get(`/csat/${token}`),
  submitScore: (token, score) => api.post(`/csat/${token}`, { score }),
  getStats: () => api.get('/csat/admin/stats'),
};

export const campaignService = {
  list: (params = {}) => api.get('/campaigns', { params }),
  create: (data) => api.post('/campaigns', data),
};

export const settingsService = {
  getLoyalty: () => api.get('/settings/loyalty'),
  getAll: () => api.get('/settings'),
  updateLoyalty: (data) => api.put('/settings/loyalty', data),
};

export const statsService = {
  getCeoDashboard: () => api.get('/stats/ceo-dashboard'),
};

export const reportService = {
  /** خروجی اکسل — بازگشت Blob */
  exportInvoices: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    // درخواست مستقیم بدون interceptor (چون پاسخ Blob است)
    return api.get(`/reports/invoices-export?${query}`, { responseType: 'blob' });
  },
  /** فایل نمونه اکسل */
  downloadSample: () => api.get('/reports/sample-excel', { responseType: 'blob' }),
  /** ورود گروهی */
  importInvoices: (formData) => api.post('/invoices/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  }),
};

export default api;

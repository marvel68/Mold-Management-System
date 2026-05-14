import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 采购API
export const purchaseAPI = {
  list: (params) => api.get('/purchases/', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases/', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
  stats: () => api.get('/purchases/stats')
}

// 工时API
export const workHourAPI = {
  list: (params) => api.get('/work-hours/', { params }),
  get: (id) => api.get(`/work-hours/${id}`),
  create: (data) => api.post('/work-hours/', data),
  update: (id, data) => api.put(`/work-hours/${id}`, data),
  delete: (id) => api.delete(`/work-hours/${id}`),
  stats: () => api.get('/work-hours/stats')
}

// 散件标准价API
export const partPriceAPI = {
  list: (params) => api.get('/part-prices/', { params }),
  categories: () => api.get('/part-prices/categories'),
  get: (id) => api.get(`/part-prices/${id}`),
  calculate: (params) => api.get('/part-prices/calculate/', { params })
}

// 模具API
export const moldAPI = {
  list: (params) => api.get('/molds/', { params }),
  get: (id) => api.get(`/molds/${id}`),
  getByNo: (moldNo) => api.get(`/molds/by-no/${moldNo}`),
  create: (data) => api.post('/molds/', data),
  update: (id, data) => api.put(`/molds/${id}`, data),
  delete: (id) => api.delete(`/molds/${id}`),
  stats: () => api.get('/molds/stats')
}

// 仪表盘API
export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats'),
  trend: (period) => api.get('/dashboard/trend', { params: { period } }),
  efficiency: () => api.get('/dashboard/efficiency')
}

// AI预测API
export const aiAPI = {
  predictPurchase: () => api.get('/ai/predict/purchase'),
  predictEfficiency: () => api.get('/ai/predict/efficiency'),
  predictSupplier: () => api.get('/ai/predict/supplier'),
  chat: (message) => api.post('/ai/chat', { message })
}

// 上传API
export const uploadAPI = {
  purchase: (formData) => api.post('/upload/purchase', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  workHours: (formData) => api.post('/upload/work-hours', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  partPrices: (formData) => api.post('/upload/part-prices', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 周透视API
export const weeklyPivotAPI = {
  getData: (params) => api.get('/purchases/weekly-pivot', { params }),
}

// 供应商API
export const supplierAPI = {
  list: (params) => api.get('/suppliers/', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers/', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  attachments: (id) => api.get(`/suppliers/${id}/attachments`)
}

// 附件API
export const attachmentAPI = {
  upload: (formData) => api.post('/attachments/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  list: (params) => api.get('/attachments/', { params }),
  download: (id) => api.get(`/attachments/${id}/download`),
  delete: (id) => api.delete(`/attachments/${id}`)
}

export default api

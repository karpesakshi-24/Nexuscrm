import api from './client'

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/me/change-password/', data),
  users: (params) => api.get('/auth/users/', { params }),
  createUser: (data) => api.post('/auth/users/', data),
  updateUser: (id, data) => api.patch(`/auth/users/${id}/`, data),
}

// ── Contacts ──────────────────────────────────────────────────
export const contactsApi = {
  list: (params) => api.get('/contacts/', { params }),
  get: (id) => api.get(`/contacts/${id}/`),
  create: (data) => api.post('/contacts/', data),
  update: (id, data) => api.patch(`/contacts/${id}/`, data),
  delete: (id) => api.delete(`/contacts/${id}/`),
  activities: (id) => api.get(`/contacts/${id}/activities/`),
  addActivity: (id, data) => api.post(`/contacts/${id}/add_activity/`, data),
  tags: () => api.get('/contacts/tags/'),
  exportCsv: () => api.get('/contacts/export_csv/', { responseType: 'blob' }),
}

// ── Tasks ─────────────────────────────────────────────────────
export const tasksApi = {
  list: (params) => api.get('/tasks/', { params }),
  get: (id) => api.get(`/tasks/${id}/`),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
  today: () => api.get('/tasks/today/'),
  overdue: () => api.get('/tasks/overdue/'),
  upcoming: () => api.get('/tasks/upcoming/'),
}

// ── Pipeline ──────────────────────────────────────────────────
export const pipelineApi = {
  pipelines: () => api.get('/pipeline/pipelines/'),
  createPipeline: (data) => api.post('/pipeline/pipelines/', data),
  stages: (pipelineId) => api.get('/pipeline/stages/', { params: { pipeline: pipelineId } }),
  deals: (params) => api.get('/pipeline/deals/', { params }),
  getDeal: (id) => api.get(`/pipeline/deals/${id}/`),
  createDeal: (data) => api.post('/pipeline/deals/', data),
  updateDeal: (id, data) => api.patch(`/pipeline/deals/${id}/`, data),
  deleteDeal: (id) => api.delete(`/pipeline/deals/${id}/`),
  moveDeal: (id, data) => api.post(`/pipeline/deals/${id}/move/`, data),
  kanban: (pipelineId) => api.get(`/pipeline/pipelines/${pipelineId}/kanban/`),
}

// ── Emails ────────────────────────────────────────────────────
export const emailsApi = {
  threads: (params) => api.get('/emails/threads/', { params }),
  getThread: (id) => api.get(`/emails/threads/${id}/`),
  send: (data) => api.post('/emails/send/', data),
  templates: () => api.get('/emails/templates/'),
}

// ── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  list: (params) => api.get('/notifications/', { params }),
  unreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
}

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard/'),
  pipelineFunnel: () => api.get('/reports/pipeline_funnel/'),
  monthlyRevenue: () => api.get('/reports/monthly_revenue/'),
  agentLeaderboard: () => api.get('/reports/agent_leaderboard/'),
}

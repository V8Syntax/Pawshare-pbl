import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const send = (method, url, data) => api[method](url, data).then((r) => r.data);

export const auth = {
  register: (d) => send('post', '/auth/register', d),
  login: (d) => send('post', '/auth/login', d),
  me: () => get('/auth/me'),
  update: (d) => send('put', '/auth/me', d),
};

export const animals = {
  list: (params) => get('/animals', params),
  get: (id) => get(`/animals/${id}`),
  matches: () => get('/animals/matches'),
  create: (formData) => send('post', '/animals', formData),
  update: (id, formData) => send('put', `/animals/${id}`, formData),
  remove: (id) => send('delete', `/animals/${id}`),
  addHealth: (id, d) => send('post', `/animals/${id}/health`, d),
};

export const applications = {
  create: (d) => send('post', '/applications', d),
  mine: () => get('/applications/mine'),
  incoming: () => get('/applications/incoming'),
  setStatus: (id, status, note) => send('patch', `/applications/${id}/status`, { status, note }),
  withdraw: (id) => send('patch', `/applications/${id}/withdraw`),
};

export const messages = {
  conversations: () => get('/messages/conversations'),
  thread: (id) => get(`/messages/conversations/${id}`),
  send: (id, text) => send('post', `/messages/conversations/${id}`, { text }),
  start: (d) => send('post', '/messages/start', d),
};

export const checkins = {
  mine: () => get('/checkins/mine'),
  owner: () => get('/checkins/owner'),
  complete: (id, d) => send('patch', `/checkins/${id}/complete`, d),
  log: (applicationId, d) => send('post', `/checkins/application/${applicationId}/log`, d),
};

export const providers = {
  list: (params) => get('/providers', params),
  get: (id) => get(`/providers/${id}`),
  review: (id, d) => send('post', `/providers/${id}/reviews`, d),
};

export const notifications = {
  list: () => get('/notifications'),
  readAll: () => send('post', '/notifications/read-all'),
};

export default api;

export const admin = {
  providers: () => get('/providers', { all: 'true' }),
  verify: (id, verified) => send('patch', `/providers/${id}/verify`, { verified }),
};

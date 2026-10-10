// Every call to the Express server is here. Pages never use fetch directly.
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Cannot reach the server. Check that it is running on port 3001.');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getTemplates: () => request('/templates'),

  listActivities: (filters) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
    return request('/activities?' + params);
  },

  createActivity: (body) => request('/activities', { method: 'POST', body: JSON.stringify(body) }),

  updateActivityStatus: (id, status, errorMessage) =>
    request(`/activities/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, errorMessage }) }),

  saveLayout: (templateId, blocks, token) =>
    request(`/templates/${templateId}/layout`, {
      method: 'PUT',
      headers: token ? { 'x-layout-token': token } : {},
      body: JSON.stringify({ blocks }),
    }),
};

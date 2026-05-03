import api from './api';

export const teamService = {
  getAll: () => api.get('/teams'),
  getById: (id) => api.get(`/teams/${id}`),
  create: (data) => api.post('/teams', data),
  update: (id, data) => api.put(`/teams/${id}`, data),
  addMember: (teamId, data) => api.post(`/teams/${teamId}/members`, data),
  removeMember: (teamId, userId) => api.delete(`/teams/${teamId}/members/${userId}`),
  updateMemberRole: (teamId, userId, role) =>
    api.put(`/teams/${teamId}/members/${userId}/role`, { role }),
};

export default teamService;

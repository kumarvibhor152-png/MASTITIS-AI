import api from './axios';

export const getCattle = async () => {
  const res = await api.get('/api/cattle');
  return res.data;
};

export const getCattleById = async (id) => {
  const res = await api.get(`/api/cattle/${id}`);
  return res.data;
};

export const addCattle = async (data) => {
  const res = await api.post('/api/cattle', data);
  return res.data;
};

export const updateCattle = async (id, data) => {
  const res = await api.put(`/api/cattle/${id}`, data);
  return res.data;
};

export const deleteCattle = async (id) => {
  const res = await api.delete(`/api/cattle/${id}`);
  return res.data;
};

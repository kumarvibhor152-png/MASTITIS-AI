import api from './axios';

export const predictMastitis = async (data) => {
  const res = await api.post('/api/predict/mastitis', data);
  return res.data;
};

export const getPredictionHistory = async (cattleId) => {
  const url = cattleId ? `/api/predict/history/${cattleId}` : '/api/predict/history';
  const res = await api.get(url);
  return res.data;
};

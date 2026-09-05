import api from './axios';

export const sendOtp = async (phone) => {
  const res = await api.post('/api/auth/send-otp', { phone });
  return res.data;
};

export const verifyOtp = async (phone, otp) => {
  const res = await api.post('/api/auth/verify-otp', { phone, otp });
  return res.data;
};

import axiosInstance from './axiosInstance';

export const authApi = {
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },
  verifyAccount: async (identifier, otpCode) => {
    const response = await axiosInstance.post('/auth/verify', { identifier, otpCode });
    return response.data;
  },
  resendOtp: async (identifier) => {
    const response = await axiosInstance.post('/auth/resend-otp', { identifier });
    return response.data;
  },
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },
  refreshToken: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/refresh', { refreshToken });
    return response.data;
  },
  logout: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/logout', { refreshToken });
    return response.data;
  },
  forgotPassword: async (identifier) => {
    const response = await axiosInstance.post('/auth/forgot-password', { identifier });
    return response.data;
  },
  resetPassword: async (payload) => {
    const response = await axiosInstance.post('/auth/reset-password', payload);
    return response.data;
  },
};

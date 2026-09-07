import axiosInstance from './axiosInstance';

export const userApi = {
  getProfile: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },
  updateProfile: async (fullName) => {
    const response = await axiosInstance.put('/users/me', { fullName });
    return response.data;
  },
  changePassword: async (payload) => {
    const response = await axiosInstance.post('/users/me/change-password', payload);
    return response.data;
  },
};

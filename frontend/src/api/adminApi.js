import axiosInstance from './axiosInstance';

export const adminApi = {
  getStats: async () => {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
  },
  getUsers: async () => {
    const response = await axiosInstance.get('/admin/users');
    return response.data;
  },
  uploadProductImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post('/admin/uploads/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { success, url }
  },
};

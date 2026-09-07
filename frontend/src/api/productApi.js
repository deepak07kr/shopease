import axiosInstance from './axiosInstance';

export const productApi = {
  getProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products', { params });
    return response.data;
  },
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },
  getCategories: async () => {
    const response = await axiosInstance.get('/categories');
    return response.data;
  },
  createProduct: async (productData) => {
    const response = await axiosInstance.post('/products', productData);
    return response.data;
  },
  updateProduct: async (id, productData) => {
    const response = await axiosInstance.put(`/products/${id}`, productData);
    return response.data;
  },
  deleteProduct: async (id) => {
    const response = await axiosInstance.delete(`/products/${id}`);
    return response.data;
  },
};

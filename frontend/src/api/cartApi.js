import axiosInstance from './axiosInstance';

export const cartApi = {
  getCart: async () => {
    const response = await axiosInstance.get('/cart');
    return response.data;
  },
  addToCart: async (productId, quantity = 1) => {
    const response = await axiosInstance.post('/cart/items', { productId, quantity });
    return response.data;
  },
  updateQuantity: async (cartItemId, quantity) => {
    const response = await axiosInstance.put(`/cart/items/${cartItemId}`, null, {
      params: { quantity },
    });
    return response.data;
  },
  removeFromCart: async (cartItemId) => {
    const response = await axiosInstance.delete(`/cart/items/${cartItemId}`);
    return response.data;
  },
  clearCart: async () => {
    const response = await axiosInstance.delete('/cart/clear');
    return response.data;
  },
  mergeCart: async (items) => {
    const response = await axiosInstance.post('/cart/merge', { items });
    return response.data;
  },
};

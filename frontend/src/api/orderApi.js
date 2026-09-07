import axiosInstance from './axiosInstance';

export const orderApi = {
  checkout: async (orderData) => {
    const response = await axiosInstance.post('/orders/checkout', orderData);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await axiosInstance.get('/orders/my-orders');
    return response.data;
  },
  getOrderById: async (orderId) => {
    const response = await axiosInstance.get(`/orders/${orderId}`);
    return response.data;
  },
  getAllOrders: async () => {
    const response = await axiosInstance.get('/orders');
    return response.data;
  },
  updateOrderStatus: async (orderId, status) => {
    const response = await axiosInstance.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};

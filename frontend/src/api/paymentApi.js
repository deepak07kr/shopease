import axiosInstance from './axiosInstance';

export const paymentApi = {
  createRazorpayOrder: async (orderId) => {
    const response = await axiosInstance.post('/payment/create-order', { orderId });
    return response.data;
  },
  verifyPayment: async (paymentDetails) => {
    const response = await axiosInstance.post('/payment/verify', paymentDetails);
    return response.data;
  },
};

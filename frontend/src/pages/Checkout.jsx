import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { orderApi } from '../api/orderApi';
import { paymentApi } from '../api/paymentApi';
import { clearCartThunk } from '../store/cartSlice';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, MapPin, CreditCard, Lock } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { items, cartTotal } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [shippingAddress, setShippingAddress] = useState({
    street: '123 Tech Park Avenue',
    city: 'Bangalore',
    state: 'Karnataka',
    zipCode: '560001',
    country: 'India',
    phone: '9876543210',
  });

  const [loading, setLoading] = useState(false);

  const handleAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast('Your cart is empty', 'error');
      navigate('/cart');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create Order in Backend
      const order = await orderApi.checkout({ shippingAddress });

      // Step 2: Create Razorpay Order
      const rzpOrderData = await paymentApi.createRazorpayOrder(order.id);

      // Step 3: Configure Razorpay Checkout Modal
      const options = {
        key: rzpOrderData.keyId,
        amount: rzpOrderData.amount * 100, // in paise
        currency: rzpOrderData.currency,
        name: 'ShopEase E-Commerce',
        description: `Payment for Order #${order.id}`,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100',
        order_id: rzpOrderData.razorpayOrderId.startsWith('order_mock_') ? undefined : rzpOrderData.razorpayOrderId,
        handler: async function (response) {
          try {
            // Step 4: Verify signature in backend
            const verificationPayload = {
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id || rzpOrderData.razorpayOrderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || 'mock_signature_accepted',
            };

            await paymentApi.verifyPayment(verificationPayload);
            dispatch(clearCartThunk());
            showToast('Payment successful! Order placed.', 'success');
            navigate('/orders');
          } catch (verErr) {
            showToast(verErr.response?.data?.message || 'Payment verification failed', 'error');
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
          contact: shippingAddress.phone,
        },
        theme: {
          color: '#0284c7',
        },
      };

      if (window.Razorpay) {
        const rzp1 = new window.Razorpay(options);
        rzp1.open();

        // If in mock/test mode without live keys, allow quick test fallback trigger
        if (rzpOrderData.razorpayOrderId.startsWith('order_mock_')) {
          setTimeout(async () => {
            options.handler({
              razorpay_order_id: rzpOrderData.razorpayOrderId,
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_signature: 'mock_signature_test',
            });
          }, 1500);
        }
      } else {
        showToast('Razorpay SDK not loaded. Simulating payment...', 'info');
        setTimeout(async () => {
          options.handler({
            razorpay_order_id: rzpOrderData.razorpayOrderId,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: 'mock_signature_test',
          });
        }, 1500);
      }

    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to initiate checkout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cartTotal || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Shipping Address</h2>
            </div>

            <form id="checkout-form" onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street Address</label>
                <input
                  type="text"
                  name="street"
                  required
                  value={shippingAddress.street}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={shippingAddress.city}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={shippingAddress.state}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ZIP / Postal Code</label>
                <input
                  type="text"
                  name="zipCode"
                  required
                  value={shippingAddress.zipCode}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  required
                  value={shippingAddress.country}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={shippingAddress.phone}
                  onChange={handleAddressChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </form>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed">
              <strong className="font-bold">Razorpay Secured Payment:</strong> Your transaction is encrypted with 256-bit SSL encryption. We accept Credit/Debit cards, UPI, Net Banking, and Wallets.
            </div>
          </div>
        </div>

        {/* Order Items & Pay Button */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">Review Order</h2>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs text-gray-700">
                <span className="truncate max-w-[180px] font-medium">{item.productName} (x{item.quantity})</span>
                <span className="font-bold">₹{item.itemTotal}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between font-extrabold text-gray-900 text-base">
              <span>Total Pay</span>
              <span className="text-blue-600">{formattedTotal}</span>
            </div>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Pay with Razorpay ({formattedTotal})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyOrders } from '../store/orderSlice';
import { Package, Clock, CheckCircle2, Truck, AlertCircle, CreditCard, ChevronRight } from 'lucide-react';

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>;
      case 'SHIPPED':
        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full"><Truck className="w-3.5 h-3.5" /> Shipped</span>;
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> Payment Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full"><AlertCircle className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Order History</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto space-y-4">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No Orders Placed Yet</h3>
          <p className="text-xs text-gray-500">Your order history will appear here after you complete a purchase.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const formattedTotal = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(order.totalAmount);

            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold block">ORDER #{order.id}</span>
                    <span className="text-xs text-gray-500">Placed on {formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="text-lg font-extrabold text-gray-900">{formattedTotal}</span>
                  </div>
                </div>

                {/* Razorpay Meta if available */}
                {order.razorpayPaymentId && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                    <span>Razorpay Payment ID: <strong className="text-gray-800">{order.razorpayPaymentId}</strong></span>
                  </div>
                )}

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded-xl bg-gray-100"
                        />
                        <div>
                          <span className="text-sm font-bold text-gray-900 block">{item.productName}</span>
                          <span className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price}</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-800">₹{item.itemTotal}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

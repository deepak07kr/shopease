import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCart,
  updateCartQuantityThunk,
  removeFromCartThunk,
  clearCartThunk,
} from '../store/cartSlice';
import { useToast } from '../context/ToastContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { items, cartTotal, totalQuantity, loading } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch, isAuthenticated]);

  const handleUpdateQuantity = async (cartItemId, newQty) => {
    try {
      await dispatch(updateCartQuantityThunk({ cartItemId, quantity: newQty })).unwrap();
    } catch (err) {
      showToast(err || 'Failed to update quantity', 'error');
    }
  };

  const handleRemove = async (cartItemId) => {
    try {
      await dispatch(removeFromCartThunk(cartItemId)).unwrap();
      showToast('Item removed from cart', 'info');
    } catch (err) {
      showToast(err || 'Failed to remove item', 'error');
    }
  };

  const handleClear = async () => {
    try {
      await dispatch(clearCartThunk()).unwrap();
      showToast('Cart cleared', 'info');
    } catch (err) {
      showToast(err || 'Failed to clear cart', 'error');
    }
  };

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(cartTotal || 0);

  if (loading && items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-900">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-gray-500">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20">
          <ArrowLeft className="w-4 h-4" /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
          Shopping Cart ({totalQuantity} items)
        </h1>
        <button
          onClick={handleClear}
          className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const itemPriceFormatted = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(item.productPrice);

            const itemTotalFormatted = new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            }).format(item.itemTotal);

            return (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-xl bg-gray-100 flex-shrink-0"
                  />
                  <div>
                    <Link to={`/products/${item.productId}`} className="font-bold text-gray-900 hover:text-blue-600 text-sm line-clamp-1">
                      {item.productName}
                    </Link>
                    <span className="text-xs text-gray-500 block mt-1">{itemPriceFormatted} each</span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                  {/* Quantity adjustment */}
                  <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 text-gray-600 hover:text-gray-900"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 text-gray-600 hover:text-gray-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Total price & delete */}
                  <div className="text-right min-w-[90px]">
                    <span className="text-sm font-extrabold text-gray-900 block">{itemTotalFormatted}</span>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit space-y-6">
          <h2 className="text-lg font-bold text-gray-900 pb-4 border-b border-gray-100">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900">{formattedTotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Estimated Tax</span>
              <span className="font-semibold text-gray-900">Included</span>
            </div>
            <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-gray-100">
              <span>Total Amount</span>
              <span className="text-blue-600">{formattedTotal}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

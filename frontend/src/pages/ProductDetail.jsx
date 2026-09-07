import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { productApi } from '../api/productApi';
import { addToCartThunk } from '../store/cartSlice';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCw, Plus, Minus } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await productApi.getProductById(id);
        setProduct(data);
      } catch (err) {
        setError('Product not found or failed to load');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await dispatch(addToCartThunk({ productId: product.id, quantity, product })).unwrap();
      showToast(`Added ${quantity} x ${product.name} to cart!`, 'success');
    } catch (err) {
      showToast(err || 'Failed to add item to cart', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Product Not Found</h2>
        <p className="text-sm text-gray-500">{error}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-100">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.categoryName && (
            <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {product.categoryName}
            </span>
          )}
        </div>

        {/* Right: Product Meta & Purchase */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-gray-900">{formattedPrice}</span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                product.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed pt-2 border-t border-gray-100">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector & Action */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-40"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all shadow-lg ${
                product.stock > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 active:scale-[0.99]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          </div>

          {/* Delivery & Warranty perks */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 text-center">
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-[11px] font-semibold text-gray-700">Free Express Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="text-[11px] font-semibold text-gray-700">1 Year Brand Warranty</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span className="text-[11px] font-semibold text-gray-700">30 Day Replacement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

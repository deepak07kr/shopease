import React, { useEffect, useState } from 'react';
import { adminApi } from '../api/adminApi';
import { productApi } from '../api/productApi';
import { orderApi } from '../api/orderApi';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
  Upload,
  ImageOff,
} from 'lucide-react';

export default function AdminDashboard() {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'products', 'orders', 'users'
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageUrlInput, setShowImageUrlInput] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State for Product Creation/Edit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    imageUrl: '',
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, prodsData, catsData, ordersData, usersData] = await Promise.all([
        adminApi.getStats(),
        productApi.getProducts({ size: 100 }),
        productApi.getCategories(),
        orderApi.getAllOrders(),
        adminApi.getUsers(),
      ]);

      setStats(statsData);
      setProducts(prodsData.content || []);
      setCategories(catsData || []);
      setOrders(ordersData || []);
      setUsers(usersData || []);
    } catch (err) {
      showToast('Failed to load admin dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Product CRUD
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setShowImageUrlInput(false);
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: categories[0]?.id || '',
      imageUrl: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    // If the product already has an image (upload or URL), show the URL box
    // pre-filled so it's clear an image is already set and can be edited directly.
    setShowImageUrlInput(!!product.imageUrl);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
    });
    setIsProductModalOpen(true);
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be smaller than 5MB', 'error');
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const { url } = await adminApi.uploadProductImage(file);
      setProductForm((prev) => ({ ...prev, imageUrl: url }));
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // allow re-selecting the same file later
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, productForm);
        showToast('Product updated successfully!', 'success');
      } else {
        await productApi.createProduct(productForm);
        showToast('Product created successfully!', 'success');
      }
      setIsProductModalOpen(false);
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productApi.deleteProduct(id);
      showToast('Product deleted', 'info');
      loadAdminData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  // Order Status Update
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      showToast(`Order #${orderId} status updated to ${newStatus}`, 'success');
      loadAdminData();
    } catch (err) {
      showToast('Failed to update order status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(stats?.totalRevenue || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
              Admin Portal
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Full Privileges
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Manage catalog products, stock levels, orders, and registered users.</p>
        </div>

        <button
          onClick={loadAdminData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors w-fit"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Product Stock ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Users ({users.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold block">Total Revenue</span>
                <span className="text-2xl font-black text-gray-900">{formattedRevenue}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold block">Total Orders</span>
                <span className="text-2xl font-black text-gray-900">{stats?.totalOrders}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold block">Total Users</span>
                <span className="text-2xl font-black text-gray-900">{stats?.totalUsers}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-semibold block">Low Stock Alert</span>
                <span className="text-2xl font-black text-gray-900">{stats?.lowStockProductsCount} items</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Order Breakdown */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">Order Status Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-amber-50 rounded-xl">
                  <span className="font-semibold text-amber-800">Pending Orders</span>
                  <span className="font-black text-amber-900">{stats?.pendingOrders}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-xl">
                  <span className="font-semibold text-emerald-800">Paid Orders</span>
                  <span className="font-black text-emerald-900">{stats?.paidOrders}</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-blue-50 rounded-xl">
                  <span className="font-semibold text-blue-800">Shipped Orders</span>
                  <span className="font-black text-blue-900">{stats?.shippedOrders}</span>
                </div>
              </div>
            </div>

            {/* Quick System Status */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Backend Services Operational</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                ShopEase Spring Boot 3 REST API is running smoothly. MySQL Database connected, JWT Stateless Authentication active, Razorpay Webhook listeners active.
              </p>
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2 text-[11px]">
                <span className="bg-slate-800 px-3 py-1 rounded-full text-blue-400">Spring Boot 3.3</span>
                <span className="bg-slate-800 px-3 py-1 rounded-full text-purple-400">Security 6</span>
                <span className="bg-slate-800 px-3 py-1 rounded-full text-emerald-400">Razorpay SDK</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Products Catalog</h2>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="p-4">Product</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                        <img src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} alt="" className="w-10 h-10 object-cover rounded-lg bg-gray-100" />
                        <div>
                          <span>{p.name}</span>
                          <span className="block text-[10px] text-gray-400 font-normal">ID: #{p.id}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">{p.categoryName}</td>
                      <td className="p-4 font-bold text-gray-900">₹{p.price}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold ${
                          p.stock < 10 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleOpenEditModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => {
                  const isExpanded = expandedOrderId === o.id;
                  return (
                    <React.Fragment key={o.id}>
                      <tr
                        className="hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                      >
                        <td className="p-4 text-gray-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </td>
                        <td className="p-4 font-bold text-gray-900">#{o.id}</td>
                        <td className="p-4">
                          <span className="font-semibold text-gray-900 block">{o.userName}</span>
                          <span className="text-[10px] text-gray-400">{o.userEmail}</span>
                        </td>
                        <td className="p-4 font-bold text-gray-900">₹{o.totalAmount}</td>
                        <td className="p-4 font-bold">
                          <span className={`px-2.5 py-1 rounded-full ${
                            o.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                            o.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                            o.status === 'DELIVERED' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="PAID">PAID</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50/70">
                          <td colSpan={6} className="p-0">
                            <div className="p-5 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                  Items in Order #{o.id}
                                </h4>
                                {o.shippingAddress && (
                                  <span className="text-[11px] text-gray-500">
                                    Shipping to: <span className="font-semibold text-gray-700">
                                      {o.shippingAddress.street}, {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.zipCode}
                                    </span>
                                  </span>
                                )}
                              </div>

                              {(!o.orderItems || o.orderItems.length === 0) ? (
                                <p className="text-xs text-gray-400">No item details available for this order.</p>
                              ) : (
                                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                                  {o.orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-3">
                                      <img
                                        src={item.productImage}
                                        alt={item.productName}
                                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                                        onError={(e) => { e.target.style.visibility = 'hidden'; }}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-xs truncate">{item.productName}</p>
                                        <p className="text-[10px] text-gray-400">Product ID: {item.productId}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="text-[10px] text-gray-400">{item.quantity} × ₹{item.price}</p>
                                        <p className="font-bold text-gray-900 text-xs">₹{item.itemTotal}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                  <th className="p-4">User ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-900">#{u.id}</td>
                    <td className="p-4 font-semibold text-gray-900">{u.name}</td>
                    <td className="p-4 text-gray-600">{u.email}</td>
                    <td className="p-4 font-bold">
                      <span className={`px-2.5 py-1 rounded-full ${
                        u.role === 'ROLE_ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={productForm.categoryId}
              onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Product Image</label>

            <div className="flex items-start gap-3">
              <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {productForm.imageUrl ? (
                  <img src={productForm.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="w-6 h-6 text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl cursor-pointer text-gray-600 hover:text-blue-600 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{productForm.imageUrl ? 'Replace image from your device' : 'Upload image from your device'}</span>
                    </>
                  )}
                </label>

                {/* This is an alternative to uploading, not a second required
                    field - hidden by default so it doesn't look mandatory. */}
                {showImageUrlInput ? (
                  <input
                    type="url"
                    autoFocus
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    placeholder="https://... (paste a link instead of uploading)"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowImageUrlInput(true)}
                    className="text-[11px] font-semibold text-gray-400 hover:text-blue-600"
                  >
                    ...or paste an image link instead
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-500/20"
          >
            {editingProduct ? 'Update Product' : 'Save Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

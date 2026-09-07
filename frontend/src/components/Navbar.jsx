import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, User, LogOut, Shield, Search, Menu, X, Package } from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { resetCart } from '../store/cartSlice';
import { setSearchQuery } from '../store/productSlice';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalQuantity } = useSelector((state) => state.cart);
  const [search, setSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logoutUser());
    dispatch(resetCart());
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setSearchQuery(search));
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-blue-600">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              S
            </div>
            <span>ShopEase</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </form>

          {/* Nav Actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Home
            </Link>

            {isAuthenticated && (
              <Link to="/orders" className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <Package className="w-4 h-4" />
                <span>My Orders</span>
              </Link>
            )}

            {isAuthenticated && (
              <Link to="/account" className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                <User className="w-4 h-4" />
                <span>My Account</span>
              </Link>
            )}

            {user?.role === 'ROLE_ADMIN' && (
              <Link to="/admin" className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}

            {/* Cart Icon */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {totalQuantity}
                </span>
              )}
            </Link>

            {/* Auth Dropdown / Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link to="/account" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user?.fullName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-blue-600 px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/cart" className="relative p-2 text-gray-700">
              <ShoppingCart className="w-6 h-6" />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </form>

          <div className="flex flex-col gap-2 pt-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg">Home</Link>
            {isAuthenticated && (
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg">My Orders</Link>
            )}
            {isAuthenticated && (
              <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-base font-medium text-gray-800 hover:bg-gray-50 rounded-lg">My Account</Link>
            )}
            {user?.role === 'ROLE_ADMIN' && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-base font-medium text-amber-700 bg-amber-50 rounded-lg">Admin Dashboard</Link>
            )}
            {isAuthenticated ? (
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 font-semibold text-gray-800 border rounded-lg">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 font-semibold text-white bg-blue-600 rounded-lg">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

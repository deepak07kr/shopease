import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      showToast('Welcome back!', 'success');
      navigate(redirectTo, { replace: true });
    } else {
      const message = result.payload || 'Login failed';
      showToast(message, 'error');
      // Unverified accounts get a clear path to finish verification.
      if (typeof message === 'string' && message.toLowerCase().includes('verify')) {
        navigate('/verify-account', { state: { identifier: formData.identifier } });
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-blue-500/30">
            S
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Sign In to ShopEase</h2>
          <p className="text-xs text-gray-500">Access your saved cart, order history, and payment settings</p>
        </div>

        {/* Demo Credentials Alert */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs space-y-1 text-blue-900">
          <div className="font-bold flex items-center gap-1.5 text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Security & Authentication:
          </div>
          <div><strong className="font-semibold">1:</strong> JWT-based authentication</div>
          <div><strong className="font-semibold">2:</strong> OTP email verification</div>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Email or Mobile Number
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                name="identifier"
                required
                autoComplete="username"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="xyz@email.com  or 8709487760"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-gray-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-600 select-none">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => showToast('Google sign-in is not configured yet.', 'info')}
            className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Continue with Google
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
          New to ShopEase?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import { User, Mail, Phone, Lock, UserPlus, Eye, EyeOff, Check, X } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'A special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function passwordStrength(password) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (!password) return { score: 0, label: '', color: 'bg-gray-200' };
  if (passed <= 2) return { score: passed, label: 'Weak', color: 'bg-red-500' };
  if (passed <= 4) return { score: passed, label: 'Fair', color: 'bg-amber-500' };
  return { score: passed, label: 'Strong', color: 'bg-emerald-500' };
}

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = useMemo(() => passwordStrength(formData.password), [formData.password]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    return () => {
      dispatch(clearError());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    setFieldErrors({ ...fieldErrors, [name]: undefined });
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Enter a valid email address';
    if (!/^\+?[0-9]{7,15}$/.test(formData.phone)) errors.phone = 'Enter a valid mobile number';
    if (strength.score < 5) errors.password = 'Password does not meet all requirements';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (!formData.acceptTerms) errors.acceptTerms = 'You must accept the Terms & Conditions';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      showToast('Account created! Please verify your email to continue.', 'success');
      navigate('/verify-account', { state: { identifier: result.payload.identifier, devOtp: result.payload.devOtp } });
    } else {
      showToast(result.payload || 'Registration failed', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-blue-500/30">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Your Account</h2>
          <p className="text-xs text-gray-500">Join ShopEase for a faster, personalized shopping experience</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <input
                id="fullName" type="text" name="fullName" required
                value={formData.fullName} onChange={handleChange}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {fieldErrors.fullName && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                id="email" type="email" name="email" required autoComplete="email"
                value={formData.email} onChange={handleChange}
                placeholder="jane@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {fieldErrors.email && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1.5">Mobile Number</label>
            <div className="relative">
              <input
                id="phone" type="tel" name="phone" required autoComplete="tel"
                value={formData.phone} onChange={handleChange}
                placeholder="+1 9876543210"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            {fieldErrors.phone && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password" type={showPassword ? 'text' : 'password'} name="password" required autoComplete="new-password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {formData.password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-gray-500">{strength.label}</p>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(formData.password);
                    return (
                      <li key={rule.label} className={`text-[10px] flex items-center gap-1 ${passed ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {fieldErrors.password && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" required autoComplete="new-password"
                value={formData.confirmPassword} onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="text-[11px] text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          <label className="flex items-start gap-2 text-xs font-medium text-gray-600 select-none">
            <input
              type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
              className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>I agree to the <span className="font-semibold text-gray-800">Terms &amp; Conditions</span> and Privacy Policy</span>
          </label>
          {fieldErrors.acceptTerms && <p className="text-[11px] text-red-600 -mt-2">{fieldErrors.acceptTerms}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Create Account</span>
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
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import { Lock, Eye, EyeOff, KeyRound, Check, X } from 'lucide-react';

const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper & lowercase letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'A special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { loading } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    identifier: location.state?.identifier || '',
    otpCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const allRulesPass = useMemo(
    () => PASSWORD_RULES.every((r) => r.test(formData.newPassword)),
    [formData.newPassword]
  );

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRulesPass) {
      showToast('Password does not meet all requirements', 'error');
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const result = await dispatch(resetPassword(formData));
    if (resetPassword.fulfilled.match(result)) {
      showToast('Password reset successfully. Please log in.', 'success');
      navigate('/login');
    } else {
      showToast(result.payload || 'Failed to reset password', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-blue-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reset Your Password</h2>
          <p className="text-xs text-gray-500">Enter the code we sent you and choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-xs font-semibold text-gray-700 mb-1.5">Email or Mobile Number</label>
            <input
              id="identifier" type="text" name="identifier" required
              value={formData.identifier} onChange={handleChange}
              placeholder="john@example.com or 9876543210"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label htmlFor="otpCode" className="block text-xs font-semibold text-gray-700 mb-1.5">6-Digit Reset Code</label>
            <input
              id="otpCode" type="text" name="otpCode" required maxLength={6} inputMode="numeric"
              value={formData.otpCode} onChange={handleChange}
              placeholder="123456"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm tracking-[0.3em] font-bold text-center focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-xs font-semibold text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                id="newPassword" type={showPassword ? 'text' : 'password'} name="newPassword" required
                value={formData.newPassword} onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.newPassword && (
              <ul className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(formData.newPassword);
                  return (
                    <li key={rule.label} className={`text-[10px] flex items-center gap-1 ${passed ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {passed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              id="confirmPassword" type={showPassword ? 'text' : 'password'} name="confirmPassword" required
              value={formData.confirmPassword} onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

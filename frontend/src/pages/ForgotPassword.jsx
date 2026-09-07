import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import { Mail, KeyRound } from 'lucide-react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { loading } = useSelector((state) => state.auth);
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(forgotPassword(identifier));
    // Always show the same generic outcome, whether or not the account exists,
    // so this form can never be used to check who is registered.
    if (forgotPassword.fulfilled.match(result)) {
      setSubmitted(true);
    } else {
      showToast(result.payload || 'Something went wrong. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-blue-500/30">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password?</h2>
          <p className="text-xs text-gray-500">Enter your email or mobile number and we'll send you a reset code</p>
        </div>

        {submitted ? (
          <div className="space-y-5">
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl">
              If an account exists for that email or mobile number, a password reset code has been sent.
            </div>
            <button
              onClick={() => navigate('/reset-password', { state: { identifier } })}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all"
            >
              I have a code &mdash; Reset password
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-xs font-semibold text-gray-700 mb-1.5">
                Email or Mobile Number
              </label>
              <div className="relative">
                <input
                  id="identifier" type="text" required
                  value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="john@example.com or 9876543210"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Send Reset Code</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

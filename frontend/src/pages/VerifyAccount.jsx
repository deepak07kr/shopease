import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { verifyAccount, resendOtp, clearError } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

export default function VerifyAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { loading, error, pendingVerification } = useSelector((state) => state.auth);

  const identifier = location.state?.identifier || pendingVerification || '';
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (!identifier) {
      navigate('/register', { replace: true });
    }
    return () => dispatch(clearError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || ''));
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== OTP_LENGTH) {
      showToast('Please enter the full 6-digit code', 'error');
      return;
    }

    const result = await dispatch(verifyAccount({ identifier, otpCode }));
    if (verifyAccount.fulfilled.match(result)) {
      showToast('Account verified! You can now log in.', 'success');
      navigate('/login');
    } else {
      showToast(result.payload || 'Verification failed', 'error');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    const result = await dispatch(resendOtp(identifier));
    if (resendOtp.fulfilled.match(result)) {
      showToast('A new verification code has been sent.', 'success');
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
    } else {
      showToast(result.payload || 'Failed to resend code', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Verify Your Account</h2>
          <p className="text-xs text-gray-500">
            We've sent a 6-digit verification code to <span className="font-semibold text-gray-800">{identifier}</span>
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                aria-label={`Digit ${index + 1} of verification code`}
                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Verify Account</span>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-gray-600">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className="font-bold text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>

        <div className="text-center pt-2 border-t border-gray-100 text-xs text-gray-600">
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { userApi } from '../api/userApi';
import { logoutUser } from '../store/authSlice';
import { useToast } from '../context/ToastContext';
import {
  User, Mail, Phone, ShieldCheck, ShieldAlert, Package, ShoppingCart,
  Lock, LogOut, Edit2, Eye, EyeOff,
} from 'lucide-react';

export default function Account() {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(user);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    userApi.getProfile().then(setProfile).catch(() => {});
  }, []);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await userApi.updateProfile(fullName);
      setProfile(updated);
      setEditingName(false);
      showToast('Profile updated', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      const res = await userApi.changePassword(passwordForm);
      showToast(res.message || 'Password changed', 'success');
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick links */}
        <div className="space-y-3">
          <Link to="/orders" className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">My Orders</span>
          </Link>
          <Link to="/cart" className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">My Cart</span>
          </Link>
          <button
            onClick={() => dispatch(logoutUser())}
            className="w-full flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-semibold">Logout</span>
          </button>
        </div>

        {/* Profile card */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Profile</h2>
              {profile.verified ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" /> Not Verified
                </span>
              )}
            </div>

            {editingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                </div>
                <button type="submit" disabled={savingProfile} className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
                  Save
                </button>
                <button type="button" onClick={() => setEditingName(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">{profile.fullName}</span>
                </div>
                <button onClick={() => { setFullName(profile.fullName); setEditingName(true); }} className="text-gray-400 hover:text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{profile.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{profile.phone}</span>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" /> Change Password
              </h2>
              {!showPasswordForm && (
                <button onClick={() => setShowPasswordForm(true)} className="text-xs font-bold text-blue-600 hover:underline">
                  Change
                </button>
              )}
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Current password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="New password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={savingPassword} className="px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
                    {savingPassword ? 'Saving...' : 'Update Password'}
                  </button>
                  <button type="button" onClick={() => setShowPasswordForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

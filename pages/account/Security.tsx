import React, { useState } from 'react';
import { KeyRound, Loader2, LogOut, ShieldCheck, User } from 'lucide-react';
import AccountLayout from '../../components/account/AccountLayout';
import { changePassword, logoutAllSessions } from '../../services/profileService';

interface SecurityProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const Security: React.FC<SecurityProps> = ({ onLoginClick, cartItemCount, onCartClick, onNavigate }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password confirmation does not match.' });
      return;
    }

    setIsSaving(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsSaving(false);

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Failed to update password.' });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Password updated successfully.' });
  };

  const handleLogoutAllSessions = async () => {
    setMessage(null);
    setIsLoggingOutAll(true);
    const result = await logoutAllSessions();
    setIsLoggingOutAll(false);

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Failed to log out all sessions.' });
      return;
    }

    setMessage({ type: 'success', text: 'All sessions were signed out. Please log in again.' });
    onNavigate('login');
  };

  return (
    <AccountLayout
      activeTab="security"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="Security"
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-bold border ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Password & Access</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                placeholder="Enter your current password"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-bold"
                placeholder="Retype new password"
                required
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Update Password
              </button>

              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest hover:border-gray-900"
              >
                <User className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
          <h3 className="text-lg font-black text-gray-900 mb-3">Session Management</h3>
          <p className="text-sm font-semibold text-gray-600 mb-5">
            If you logged in on another device, you can end all active sessions for better account safety.
          </p>
          <button
            type="button"
            onClick={handleLogoutAllSessions}
            disabled={isLoggingOutAll}
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl border border-red-200 bg-red-50 text-red-700 font-black text-xs uppercase tracking-widest hover:bg-red-100 disabled:opacity-60"
          >
            {isLoggingOutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Log Out All Devices
          </button>
        </div>
      </div>
    </AccountLayout>
  );
};

export default Security;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Camera, Check, Loader2, X, Edit2, Shield, AlertCircle, LogOut } from 'lucide-react';
import AccountLayout from '../../components/account/AccountLayout';
import { getProfile, updateProfile, uploadProfileAvatar, updateEmail } from '../../services/profileService';

interface ProfileProps {
  onNavigate: (view: string) => void;
  onCartClick: () => void;
  onLoginClick: () => void;
  cartItemCount: number;
}

const Profile: React.FC<ProfileProps> = ({
  onNavigate,
  onCartClick,
  onLoginClick,
  cartItemCount,
}) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!user) {
        onNavigate('login');
        return;
      }
      try {
        const data = await getProfile();
        if (mounted && data) {
          setProfile(data);
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            email: data.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => { mounted = false; };
  }, [user, onNavigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const updates: any = {
        fullName: formData.fullName,
        phone: formData.phone,
      };

      await updateProfile(updates);

      // Email update via Firebase Auth if changed
      if (formData.email !== profile.email) {
        const emailResult = await updateEmail(formData.email);
        if (!emailResult.success) throw new Error(emailResult.error || 'Failed to update email');
      }

      setProfile({ ...profile, fullName: formData.fullName, phone: formData.phone, email: formData.email });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File | undefined) => {
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    setMessage(null);

    try {
      const publicUrl = await uploadProfileAvatar(file);
      setProfile({ ...profile, avatarUrl: publicUrl });
      setMessage({ type: 'success', text: 'Avatar updated!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload avatar' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <AccountLayout activeTab="profile" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="Profile">
        <div className="bg-white p-5 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-gray-200 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Loading your profile...</p>
        </div>
      </AccountLayout>
    );
  }

  if (!profile) {
    return (
      <AccountLayout activeTab="profile" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="Profile">
        <div className="p-5 bg-white border border-gray-200 rounded-2xl text-center flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <p className="text-gray-900 font-bold text-lg">Unable to load profile</p>
          <p className="text-gray-500 text-sm mt-1">Please try refreshing the page or login again.</p>
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout
      activeTab="profile"
      onNavigate={onNavigate}
      onCartClick={onCartClick}
      onLoginClick={onLoginClick}
      cartItemCount={cartItemCount}
      title="My Profile"
    >
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
        
        {message && (
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold border ${message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        {/* Section 1: General Info */}
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Personal Information</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">Manage your basic profile details.</p>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>
          
          <div className="p-6 sm:p-5">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gray-100 text-primary border-4 border-white shadow-md flex items-center justify-center font-black text-3xl overflow-hidden">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.fullName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile.fullName ? profile.fullName.charAt(0) : 'U'}</span>
                  )}
                </div>
                <label className={`absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-primary transition-all ${isUploadingAvatar ? 'opacity-70 pointer-events-none' : 'cursor-pointer group-hover:scale-110'}`}>
                  {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e.target.files?.[0])} />
                </label>
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900">{profile.fullName || 'User'}</h3>
                <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-widest">Member since {profile.memberSince || 'N/A'}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold uppercase tracking-widest">
                  <Check className="w-3.5 h-3.5" /> Verified Account
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-widest">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      placeholder="e.g. John Doe"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold text-gray-900">{profile.fullName || 'Not provided'}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-widest">Email Address</label>
                  {isEditing ? (
                    <>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      />
                      <p className="text-[11px] font-medium text-gray-500">Requires verification if changed.</p>
                    </>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold text-gray-900">{profile.email}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-gray-900 uppercase tracking-widest">Phone Number</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                      placeholder="e.g. 01712345678"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-semibold text-gray-900">{profile.phone || 'Not provided'}</div>
                  )}
                </div>

              </div>

              {isEditing && (
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setMessage(null);
                      setFormData({ fullName: profile.fullName || '', phone: profile.phone || '', email: profile.email || '' });
                    }}
                    className="w-full sm:w-auto px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Section 2: Security */}
        <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-5 border-b border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">Security & Privacy</h2>
              <p className="text-sm font-medium text-gray-500 mt-1">Keep your account secure.</p>
            </div>
          </div>
          
          <div className="p-6 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-gray-300 transition-all">
                <div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">Password</h4>
                  <p className="text-xs font-semibold text-gray-500">Update your secret password</p>
                </div>
                <button
                  onClick={() => onNavigate('security')}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-gray-900 hover:border-gray-400 transition-all shadow-sm group-hover:shadow-md"
                >
                  Change
                </button>
              </div>

              {/* Sessions */}
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-gray-300 transition-all">
                <div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">Active Sessions</h4>
                  <p className="text-xs font-semibold text-gray-500">Review logged in devices</p>
                </div>
                <button
                  onClick={() => onNavigate('security')}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-gray-900 hover:border-gray-400 transition-all shadow-sm group-hover:shadow-md"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </AccountLayout>
  );
};

export default Profile;

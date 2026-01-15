
import React, { useState, useEffect } from 'react';
import AccountLayout from '../../components/account/AccountLayout';
import { User, Mail, Phone, Calendar, Shield, Edit2, Check, X, Loader2 } from 'lucide-react';
import { getProfile, updateProfile, UserProfile } from '../../services/profileService';

interface ProfileProps {
  onLoginClick: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  onNavigate: (view: any) => void;
}

const Profile: React.FC<ProfileProps> = ({ onLoginClick, cartItemCount, onCartClick, onNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      if (data) {
        setProfile(data);
        setFormData({ fullName: data.fullName || '', phone: data.phone || '' });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    try {
      setIsSaving(true);
      const success = await updateProfile(formData);
      if (success) {
        setProfile({ ...profile, ...formData });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update profile", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AccountLayout activeTab="profile" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="Profile Information">
        <div className="bg-white p-20 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Fetching your profile...</p>
        </div>
      </AccountLayout>
    );
  }

  if (!profile) {
    return (
      <AccountLayout activeTab="profile" onNavigate={onNavigate} onCartClick={onCartClick} onLoginClick={onLoginClick} cartItemCount={cartItemCount} title="Profile Error">
        <div className="p-8 text-center text-red-500 font-bold">Unable to load profile information. Please try again.</div>
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
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Profile Info Card */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-red-500/20 relative">
                  {profile.fullName ? profile.fullName.charAt(0) : <User className="w-8 h-8" />}
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-gray-500 hover:text-primary transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{profile.fullName || 'User'}</h2>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Member since {profile.memberSince || 'N/A'}
                  </p>
                </div>
              </div>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              ) : null}
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                  <User className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    disabled={!isEditing}
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-100 text-gray-900 font-bold focus:border-primary outline-none transition-all disabled:text-gray-500 disabled:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="email" 
                    disabled
                    value={profile.email || ''}
                    className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-transparent text-gray-400 font-bold cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium italic">Email cannot be changed for security</p>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="tel" 
                    disabled={!isEditing}
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 bg-transparent border-b border-gray-100 text-gray-900 font-bold focus:border-primary outline-none transition-all disabled:text-gray-500 disabled:border-transparent"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="md:col-span-2 flex justify-end gap-3 mt-4 animate-in slide-in-from-top-2">
                  <button 
                    type="button"
                    onClick={() => { setIsEditing(false); if(profile) setFormData({ fullName: profile.fullName, phone: profile.phone }); }}
                    className="px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-500/20 flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
          
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex items-center justify-between">
             <p className="text-[11px] font-bold text-gray-400">Account status: <span className="text-green-600 uppercase">Verified</span></p>
             <button className="text-[11px] font-black text-primary hover:underline uppercase tracking-widest">Upgrade to Gold Membership</button>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Security & Access</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage your password and sessions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">Last changed 3 months ago</p>
                </div>
                <button className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm">Change</button>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-gray-900">2-Factor Auth</p>
                  <p className="text-xs text-gray-500">Adds extra layer of security</p>
                </div>
                <div className="w-10 h-5 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem]">
               <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-4">Last Active Session</h4>
               <div className="space-y-3">
                 <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">MacOS • Chrome</p>
                      <p className="text-xs text-gray-500">{profile.lastLogin}</p>
                    </div>
                 </div>
                 <button className="text-[11px] font-black text-red-500 hover:underline uppercase tracking-widest mt-2">Log out of all devices</button>
               </div>
            </div>
          </div>
        </div>

      </div>
    </AccountLayout>
  );
};

export default Profile;

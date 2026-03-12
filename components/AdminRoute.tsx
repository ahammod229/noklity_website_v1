
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminRouteProps {
  children: React.ReactNode;
  onNavigate: (view: any) => void;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, onNavigate }) => {
  const { user, session, isLoading, isAdmin } = useAuth();
  const hasSessionToken = Boolean(session?.access_token);

  useEffect(() => {
    // Wait for auth to finish loading
    if (!isLoading) {
      // If not logged in, redirect to login
      if (!user) {
        onNavigate('login');
        return;
      }
      
      // If logged in but not an admin, redirect to home
      if (!isAdmin) {
        console.warn('Unauthorized access attempt to admin route');
        onNavigate('home');
        return;
      }

      if (!hasSessionToken) {
        // Non-blocking recovery. If refresh fails, keep route decision based on user/admin.
        void supabase.auth.refreshSession().catch(() => {
          // noop
        });
      }
    }
  }, [user, session, isLoading, isAdmin, hasSessionToken, onNavigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Verifying Privileges...</p>
        </div>
      </div>
    );
  }

  // Prevent flash of restricted content before redirect happens
  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;

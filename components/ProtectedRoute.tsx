
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (view: any) => void;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  onNavigate, 
  adminOnly = false 
}) => {
  const { user, session, isLoading, isAdmin } = useAuth();
  const hasSessionToken = Boolean(session?.access_token);
  const [recoveringAdminSession, setRecoveringAdminSession] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const validateRoute = async () => {
      if (isLoading) return;

      if (!user) {
        onNavigate('login');
        return;
      }

      if (adminOnly && !isAdmin) {
        onNavigate('home');
        return;
      }

      if (adminOnly && !hasSessionToken) {
        // Recover session in background without forcing logout loops.
        setRecoveringAdminSession(true);
        try {
          await supabase.auth.refreshSession();
        } catch {
          // keep route accessible if user/admin is valid from auth context
        } finally {
          if (!cancelled) {
            setRecoveringAdminSession(false);
          }
        }
      }
    };

    void validateRoute();

    return () => {
      cancelled = true;
    };
  }, [user, isLoading, isAdmin, hasSessionToken, onNavigate, adminOnly]);

  if (isLoading || (adminOnly && recoveringAdminSession && !hasSessionToken)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Verifying Access...</p>
        </div>
      </div>
    );
  }

  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

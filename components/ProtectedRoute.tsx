
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

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
  const { user, isLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        onNavigate('login');
      } else if (adminOnly && !isAdmin) {
        onNavigate('home');
      }
    }
  }, [user, isLoading, isAdmin, onNavigate, adminOnly]);

  if (isLoading) {
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

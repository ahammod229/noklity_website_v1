
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  onRedirect: () => void;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, onRedirect }) => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      onRedirect();
    }
  }, [user, isLoading, onRedirect]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Verifying Session...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via effect
  }

  return <>{children}</>;
};

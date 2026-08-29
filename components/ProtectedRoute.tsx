
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { auth } from '../services/firebaseClient';
import { logoutUser } from '../services/authService';
import { Loader2, ShieldOff } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNavigate: (view: any) => void;
  adminOnly?: boolean;
}

// ─── Admin Access Denied Screen ───────────────────────────────────────────────

const AccessDenied: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
    <div className="bg-white rounded-xl shadow-lg border border-red-100 p-6 max-w-md w-full text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
        <ShieldOff className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 text-sm mb-6">
        You don't have permission to access this page.<br />
        This area is restricted to administrators only.
      </p>
      <button
        onClick={() => onNavigate('home')}
        className="w-full bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Go to Homepage
      </button>
    </div>
  </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onNavigate,
  adminOnly = false,
}) => {
  const { user, isLoading } = useAuth();

  // Double-check admin status directly from Supabase DB (server source of truth)
  // Never trust client-side isAdmin alone for admin-only routes
  const [dbAdminVerified, setDbAdminVerified]   = useState(false);
  const [adminCheckDone, setAdminCheckDone]      = useState(false);
  const [adminCheckFailed, setAdminCheckFailed]  = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    const verifyAccess = async () => {
      // Not an admin-only route — nothing to verify
      if (!adminOnly) return;

      // Still loading auth — wait
      if (isLoading) return;

      // Not logged in at all
      if (!user) {
        onNavigate('login');
        return;
      }

      const uid = auth.currentUser?.uid;
      if (!uid) {
        onNavigate('login');
        return;
      }

      try {
        // ── Server-side admin check ──────────────────────────────────────────
        // Fetches directly from Supabase users table.
        // Even if someone manipulates the client-side isAdmin flag,
        // this re-verifies from the database on every admin page load.
        const { data, error } = await supabase
          .from('users')
          .select('role, status')
          .eq('uid', uid)
          .single();

        if (abortRef.current) return;

        if (error || !data) {
          // DB unreachable — deny access for safety
          setAdminCheckFailed(true);
          setAdminCheckDone(true);
          return;
        }

        const isAdminInDb = data.role === 'admin' && data.status === 'active';

        if (!isAdminInDb) {
          setAdminCheckFailed(true);
          setAdminCheckDone(true);

          // Log unauthorized admin access attempt
          console.warn(
            `[Security] Unauthorized admin access attempt by uid=${uid} role=${data.role}`
          );
          return;
        }

        setDbAdminVerified(true);
        setAdminCheckDone(true);
      } catch (err) {
        if (!abortRef.current) {
          setAdminCheckFailed(true);
          setAdminCheckDone(true);
        }
      }
    };

    void verifyAccess();

    return () => {
      abortRef.current = true;
    };
  }, [user, isLoading, adminOnly, onNavigate]);

  // ── Non-admin routes: just check if logged in ──────────────────────────────

  if (!adminOnly) {
    if (isLoading) return <LoadingScreen />;
    if (!user) {
      onNavigate('login');
      return null;
    }
    return <>{children}</>;
  }

  // ── Admin-only route ───────────────────────────────────────────────────────

  // Still loading auth or DB check in progress
  if (isLoading || !adminCheckDone) {
    return <LoadingScreen message="Verifying admin access..." />;
  }

  // Not logged in
  if (!user) {
    onNavigate('login');
    return null;
  }

  // DB says not admin
  if (adminCheckFailed || !dbAdminVerified) {
    return <AccessDenied onNavigate={onNavigate} />;
  }

  return <>{children}</>;
};

// ─── Loading Screen ───────────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ message?: string }> = ({
  message = 'Verifying access...',
}) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{message}</p>
    </div>
  </div>
);

export default ProtectedRoute;

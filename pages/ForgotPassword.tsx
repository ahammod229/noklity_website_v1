
import React, { useState } from 'react';
import AuthLayout from '../components/AuthLayout';
import AuthInput from '../components/AuthInput';
import { Mail, Loader2, CheckCircle } from 'lucide-react';
import { resetPassword } from '../services/authService';

interface ForgotPasswordProps {
  onNavigate: (view: any) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await resetPassword(email);
      if (!result.success) {
        setError(result.error || 'Failed to send reset email.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout 
        title="Check your email" 
        subtitle={`We sent a password reset link to ${email}`}
        onBack={() => onNavigate('login')}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-center text-gray-500 text-sm mb-8">
            Click the link in the email to set a new password. If you don't see it, check your spam folder.
          </p>
          <button 
            onClick={() => onNavigate('login')}
            className="w-full bg-white text-gray-900 border border-gray-200 font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-all"
          >
            Back to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Forgot Password" 
      subtitle="Enter your email to reset your password"
      onBack={() => onNavigate('login')}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthInput
          label="Email Address"
          type="email"
          name="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          icon={Mail}
          required
        />

        {error && (
          <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;

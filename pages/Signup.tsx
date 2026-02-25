
import React, { useState, useEffect } from 'react';
import AuthLayout from '../components/AuthLayout';
import AuthInput from '../components/AuthInput';
import { Mail, Lock, User, Loader2, CheckCircle } from 'lucide-react';
import { registerUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface SignupProps {
  onNavigate: (view: any) => void;
  onSignupSuccess?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onNavigate, onSignupSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      onNavigate('profile');
    }
  }, [user, onNavigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!termsAccepted) {
      setError("You must agree to the Terms & Privacy Policy");
      return;
    }

    setLoading(true);
    
    try {
      const response = await registerUser(formData.fullName, formData.email, formData.password);
      
      if (response.error) {
        setError(response.error);
      } else {
        setIsSuccess(true);
        onSignupSuccess?.();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) return null; // Prevent flash of content

  if (isSuccess) {
    return (
      <AuthLayout 
        title="Account Created" 
        subtitle="Please check your email"
        onBack={() => onNavigate('home')}
      >
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-in zoom-in">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-center text-gray-900 font-bold mb-2 text-lg">Welcome to NOKLITY!</p>
          <p className="text-center text-gray-500 text-sm mb-8 leading-relaxed">
            We've sent a confirmation link to <span className="font-bold text-gray-900">{formData.email}</span>. 
            <br />Please verify your email address to log in.
          </p>
          <button 
            onClick={() => onNavigate('login')}
            className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
          >
            Go to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Create Account" 
      subtitle="Join NOKLITY for exclusive deals"
      onBack={() => onNavigate('home')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          label="Full Name"
          type="text"
          name="fullName"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={handleChange}
          icon={User}
          required
        />

        <AuthInput
          label="Email Address"
          type="email"
          name="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          icon={Mail}
          required
        />
        
        <AuthInput
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          icon={Lock}
          required
        />

        <AuthInput
          label="Confirm Password"
          type="password"
          name="confirmPassword"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          icon={Lock}
          required
        />

        {error && (
            <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                {error}
            </div>
        )}

        <div className="flex items-start gap-3 py-2">
            <div className="relative flex items-center pt-0.5">
                <input 
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-5 h-5 border-2 border-gray-300 rounded text-primary focus:ring-primary cursor-pointer transition-all checked:bg-primary checked:border-primary"
                />
            </div>
            <label htmlFor="terms" className="text-xs text-gray-500 leading-snug cursor-pointer select-none">
                I agree to the <button type="button" className="text-gray-900 font-bold hover:underline">Terms of Service</button> and <button type="button" className="text-gray-900 font-bold hover:underline">Privacy Policy</button>
            </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Already have an account?{' '}
          <button 
            onClick={() => onNavigate('login')}
            className="text-primary font-bold hover:underline transition-colors"
          >
            Login
          </button>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Signup;

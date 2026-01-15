import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  onBack?: () => void;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle, onBack }) => {
  // Logo SVG Data URI
  const logoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 50'%3E%3Cpath fill='%23DC2626' d='M15 5 L5 45 L30 45 L40 5 Z'/%3E%3Ctext x='50' y='38' font-family='sans-serif' font-weight='900' font-size='34' fill='%23111827' letter-spacing='-1'%3ENOKLITY%3C/text%3E%3C/svg%3E";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src={logoSrc} alt="NOKLITY" className="h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
            {title}
          </h1>
          <p className="text-gray-500 text-sm">
            {subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
            {onBack && (
                <button 
                    onClick={onBack}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-900 transition-colors"
                    title="Go Back"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            )}
            <div className="p-8">
                {children}
            </div>
        </div>

        {/* Footer info/links could go here if needed globally */}
      </div>
    </div>
  );
};

export default AuthLayout;

import React from 'react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ElementType;
}

const AuthInput: React.FC<AuthInputProps> = ({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl 
            focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none 
            transition-all duration-200 py-3.5
            ${Icon ? 'pl-11 pr-4' : 'px-4'}
            ${error ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-200' : ''}
            ${className}
          `}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default AuthInput;

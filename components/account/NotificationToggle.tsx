import React from 'react';

interface NotificationToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ 
  label, 
  description, 
  enabled, 
  onChange, 
  disabled = false 
}) => {
  return (
    <div className="flex items-start justify-between gap-4 py-4 group">
      <div className="flex-1">
        <h4 className="text-sm font-black text-gray-900 mb-1 tracking-tight group-hover:text-primary transition-colors">
          {label}
        </h4>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
          ${enabled ? 'bg-primary' : 'bg-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default NotificationToggle;

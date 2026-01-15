import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SettingsSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ id, title, subtitle, icon: Icon, children }) => {
  return (
    <section id={id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
      <div className="p-8 md:p-10 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-gray-100">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="p-8 md:p-10 space-y-8">
        {children}
      </div>
    </section>
  );
};

export default SettingsSection;

import React from 'react';
import { TranslationStrings } from '../../services/languageService';

interface LanguageTabsProps {
  activeTab: 'en' | 'bn';
  onTabChange: (tab: 'en' | 'bn') => void;
  content: TranslationStrings;
  onFieldChange: (section: keyof TranslationStrings, field: string, value: string) => void;
}

const LanguageTabs: React.FC<LanguageTabsProps> = ({ activeTab, onTabChange, content, onFieldChange }) => {
  const sections = [
    { key: 'header', label: 'Header & Navigation' },
    { key: 'buttons', label: 'Buttons & Actions' },
    { key: 'common', label: 'Global Text' }
  ];

  return (
    <div className="space-y-8">
      {/* Tab Selectors */}
      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => onTabChange('en')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          English (EN)
        </button>
        <button
          onClick={() => onTabChange('bn')}
          className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === 'bn' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Bangla (BN)
        </button>
      </div>

      {/* Input Groups */}
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.key} className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em] whitespace-nowrap">
                {section.label}
              </h3>
              <div className="h-px bg-gray-100 w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {Object.keys(content[section.key as keyof TranslationStrings]).map((field) => (
                <div key={field} className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={(content[section.key as keyof TranslationStrings] as any)[field]}
                    onChange={(e) => onFieldChange(section.key as keyof TranslationStrings, field, e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageTabs;

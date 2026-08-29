import React, { useState, useEffect } from 'react';
import { Languages, Save, RotateCcw, Loader2, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import LanguageTabs from '../../components/admin/LanguageTabs';
import { getLanguageConfig, updateLanguageConfig, LanguageConfig } from '../../services/languageService';

const AdminLanguage: React.FC = () => {
  const [config, setConfig] = useState<LanguageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'en' | 'bn'>('en');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    const data = await getLanguageConfig();
    setConfig(data);
    setLoading(false);
  };

  const handleFieldChange = (section: any, field: string, value: string) => {
    if (!config) return;
    setHasChanges(true);
    const newConfig = { ...config };
    (newConfig.content[activeTab][section] as any)[field] = value;
    setConfig(newConfig);
  };

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    const success = await updateLanguageConfig(config);
    if (success) {
      setShowToast(true);
      setHasChanges(false);
      setTimeout(() => setShowToast(false), 3000);
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-bold tracking-tight">Loading Language Matrix...</p>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-24">
      
      {/* Header Panel */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-5 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 flex items-center justify-center text-primary shadow-inner">
            <Languages className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Language Control</h2>
            <p className="text-gray-500 font-medium">Manage localized content for your global audience.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <button 
              onClick={fetchConfig}
              className="px-6 py-4 text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={`
              px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl
              ${!hasChanges 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-primary text-white hover:bg-red-700 active:scale-95 shadow-red-500/20'}
            `}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Translation
          </button>
        </div>
      </div>

      {/* Global Config Card */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">General Localization</h3>
            </div>
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
              <div>
                <p className="text-sm font-black text-gray-900">Default Language</p>
                <p className="text-xs text-gray-500">The primary language used on first visit.</p>
              </div>
              <select 
                value={config.defaultLanguage}
                onChange={(e) => setConfig({ ...config, defaultLanguage: e.target.value as any })}
                className="bg-white px-4 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="en">English (EN)</option>
                <option value="bn">Bangla (BN)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2 opacity-0 md:opacity-100">
              <Sparkles className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Features</h3>
            </div>
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100">
              <div>
                <p className="text-sm font-black text-gray-900">Multi-Language Support</p>
                <p className="text-xs text-gray-500">Allow customers to toggle between EN and BN.</p>
              </div>
              <button 
                onClick={() => setConfig({ ...config, enableMultiLanguage: !config.enableMultiLanguage })}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                  ${config.enableMultiLanguage ? 'bg-primary' : 'bg-gray-200'}
                `}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enableMultiLanguage ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Editor */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[600px]">
        <LanguageTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          content={config.content[activeTab]}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* Success Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-[100] bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight">Translations Updated</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global strings updated successfully</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLanguage;

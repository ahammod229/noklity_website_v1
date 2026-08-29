import fs from 'fs';

let content = fs.readFileSync('pages/admin/HeroBanners.tsx', 'utf8');

const injectionPoint = `<div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
            value={form.target_type}`;

const settingsUI = `
        {/* Advanced Settings */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Advanced Appearance</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Text Layout</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.layout}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, layout: e.target.value as any}}))}
              >
                <option value="left">Left Align</option>
                <option value="center">Center Align</option>
                <option value="right">Right Align</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Image Overlay</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.overlay}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, overlay: e.target.value as any}}))}
              >
                <option value="dark-gradient">Dark Gradient (Left)</option>
                <option value="light-gradient">Light Gradient (Left)</option>
                <option value="solid-dark">Solid Dark Overlay</option>
                <option value="solid-light">Solid Light Overlay</option>
                <option value="none">No Overlay</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Text Theme</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.text_theme}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, text_theme: e.target.value as any}}))}
              >
                <option value="light">Light (White Text)</option>
                <option value="dark">Dark (Black Text)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Banner Height</label>
              <select 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.settings.banner_height}
                onChange={(e) => setForm(prev => ({...prev, settings: {...prev.settings, banner_height: e.target.value as any}}))}
              >
                <option value="standard">Standard (500px)</option>
                <option value="tall">Tall (600px)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-semibold"
            value={form.target_type}`;

content = content.replace(injectionPoint, settingsUI);
fs.writeFileSync('pages/admin/HeroBanners.tsx', content);

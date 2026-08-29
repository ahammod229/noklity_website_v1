import fs from 'fs';

let content = fs.readFileSync('components/Hero.tsx', 'utf8');

// The banner mapping code
// Let's replace the gradient layer first
content = content.replace(
  '<div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/50 to-transparent" />',
  `{/* Dynamic Overlay per banner */}
                  {(() => {
                    const overlay = (banner as any).settings?.overlay || 'dark-gradient';
                    switch (overlay) {
                      case 'dark-gradient': return <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/50 to-transparent" />;
                      case 'light-gradient': return <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/50 to-transparent" />;
                      case 'solid-dark': return <div className="absolute inset-0 bg-gray-950/60" />;
                      case 'solid-light': return <div className="absolute inset-0 bg-white/60" />;
                      default: return null;
                    }
                  })()}`
);

// We need to extract activeSettings
// Before `<div className="relative h-full flex items-center px-12 lg:px-16">` we should define the settings for active banner.
// Let's replace the whole desktop content section for cleaner insertion.
// Wait, regex replacing multiline JSX is risky. Let's do it carefully.

const desktopContentStart = '<div className="relative h-full flex items-center px-12 lg:px-16">';
const desktopContentEnd = '</div>\n              </div>\n            </div>'; // approximate

// Instead of string replacement for huge chunks, let's inject logic dynamically.
content = content.replace(
  '<div className="relative h-full flex items-center px-12 lg:px-16">',
  `{(() => {
              const activeSettings = (activeBanner as any).settings || {};
              const layout = activeSettings.layout || 'left';
              const textTheme = activeSettings.text_theme || 'light';
              
              const justifyClass = layout === 'center' ? 'justify-center' : layout === 'right' ? 'justify-end' : 'justify-start';
              const textJustify = layout === 'center' ? 'text-center' : layout === 'right' ? 'text-right' : 'text-left';
              const boxAlign = layout === 'center' ? 'items-center mx-auto' : layout === 'right' ? 'items-end ml-auto' : 'items-start';
              const textColorClass = textTheme === 'dark' ? 'text-gray-900' : 'text-white';
              const subTextColorClass = textTheme === 'dark' ? 'text-gray-700' : 'text-gray-200';
              const glassmorphismClass = textTheme === 'dark' ? 'bg-white/40 border-white/40' : 'bg-black/30 border-white/10';

              return (
            <div className={\`relative h-full flex items-center px-12 lg:px-16 \${justifyClass}\`}>
              <div className={\`\${glassmorphismClass} backdrop-blur-md border p-6 md:p-8 rounded-2xl max-w-lg w-full \${textColorClass} \${textJustify} shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col \${boxAlign}\`}>`
);

content = content.replace(
  '<div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 md:p-6 rounded-xl max-w-lg w-full text-white shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">',
  ''
);

content = content.replace(
  '<div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/40 rounded-full blur-[60px] pointer-events-none" />',
  '{textTheme === \'light\' && <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/40 rounded-full blur-[60px] pointer-events-none" />}'
);

content = content.replace(
  '<div className="inline-flex items-center gap-2 bg-primary px-3 py-1.5 rounded-full mb-6 shadow-lg shadow-red-900/20 border border-white/10">',
  '<div className={`inline-flex items-center gap-2 bg-primary px-3 py-1.5 rounded-full mb-6 shadow-lg border border-white/10 ${textTheme === "dark" ? "shadow-red-900/10" : "shadow-red-900/20"}`}>'
);

content = content.replace(
  '<p className="text-gray-200 text-sm md:text-base mb-8 leading-relaxed font-medium opacity-90 max-w-sm">',
  '<p className={`${subTextColorClass} text-sm md:text-base mb-8 leading-relaxed font-medium opacity-90 max-w-sm`}>'
);

// We need to close the IIFE.
content = content.replace(
  '                  {errorText && (\n                    <p className="mt-4 text-xs text-amber-200 font-semibold">\n                      {errorText.includes(\'hero_banners\') ? \'Hero banners are not ready in database yet.\' : errorText}\n                    </p>\n                  )}\n                </div>\n              </div>\n            </div>',
  '                  {errorText && (\n                    <p className={`mt-4 text-xs font-semibold ${textTheme === "dark" ? "text-red-600" : "text-amber-200"}`}>\n                      {errorText.includes(\'hero_banners\') ? \'Hero banners are not ready in database yet.\' : errorText}\n                    </p>\n                  )}\n                </div>\n              </div>\n            </div>\n            );\n            })()}'
);

// Fix banner height mapping:
content = content.replace(
  'md:h-[500px] lg:h-[520px]',
  '${(() => { const h = (activeBanner as any).settings?.banner_height; return h === "tall" ? "md:h-[600px] lg:h-[650px]" : "md:h-[500px] lg:h-[520px]"; })()}'
);

// Fix secondary button color for light/dark
content = content.replace(
  'className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 backdrop-blur-sm hover:-translate-y-1"',
  'className={`backdrop-blur-sm text-sm font-bold py-4 px-8 rounded-full transition-all duration-300 hover:-translate-y-1 border ${textTheme === "dark" ? "bg-gray-900/10 hover:bg-gray-900/20 border-gray-900/20 text-gray-900" : "bg-white/10 hover:bg-white/20 border-white/20 text-white"}`}'
);

// Save and log
fs.writeFileSync('components/Hero.tsx', content);
console.log("Updated Hero.tsx");


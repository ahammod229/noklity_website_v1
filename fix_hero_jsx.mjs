import fs from 'fs';

let content = fs.readFileSync('components/Hero.tsx', 'utf8');

content = content.replace(
  'className="hidden md:block relative rounded-2xl overflow-hidden ${(() => { const h = (activeBanner as any).settings?.banner_height; return h === "tall" ? "md:h-[600px] lg:h-[650px]" : "md:h-[500px] lg:h-[520px]"; })()} w-full shadow-2xl shadow-gray-200 group transform transition-all hover:shadow-gray-300 cursor-pointer"',
  'className={`hidden md:block relative rounded-2xl overflow-hidden ${(() => { const h = (activeBanner as any).settings?.banner_height; return h === "tall" ? "md:h-[600px] lg:h-[650px]" : "md:h-[500px] lg:h-[520px]"; })()} w-full shadow-2xl shadow-gray-200 group transform transition-all hover:shadow-gray-300 cursor-pointer`}'
);

fs.writeFileSync('components/Hero.tsx', content);

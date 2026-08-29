import fs from 'fs';

let content = fs.readFileSync('pages/admin/HeroBanners.tsx', 'utf8');

// Update HeroBanner interface
content = content.replace(
  '  created_at: string;\n}',
  '  created_at: string;\n  mobile_image_url: string | null;\n  settings: any;\n}'
);

// Update HeroForm interface
content = content.replace(
  '  sort_order: number;\n}',
  '  sort_order: number;\n  settings: {\n    layout: "left" | "center" | "right";\n    overlay: "dark-gradient" | "light-gradient" | "solid-dark" | "solid-light" | "none";\n    text_theme: "light" | "dark";\n    banner_height: "standard" | "tall";\n  };\n}'
);

// Update EMPTY_FORM
content = content.replace(
  '  sort_order: 0\n};',
  '  sort_order: 0,\n  settings: {\n    layout: "left",\n    overlay: "dark-gradient",\n    text_theme: "light",\n    banner_height: "standard"\n  }\n};'
);

// Update handleEdit
content = content.replace(
  '      target_category: banner.target_category || \'\',',
  '      target_category: banner.target_category || \'\',\n      settings: {\n        layout: banner.settings?.layout || "left",\n        overlay: banner.settings?.overlay || "dark-gradient",\n        text_theme: banner.settings?.text_theme || "light",\n        banner_height: banner.settings?.banner_height || "standard"\n      },'
);

// Update payloadFromForm
content = content.replace(
  '    sort_order: form.sort_order',
  '    sort_order: form.sort_order,\n    settings: form.settings'
);

// We'll write the new UI section in a minute. Let's just save this and verify it worked.
fs.writeFileSync('pages/admin/HeroBanners.tsx', content);

import fs from 'fs';
let content = fs.readFileSync('tailwind.config.cjs', 'utf8');

if (!content.includes('@tailwindcss/typography')) {
  content = content.replace(
    'plugins: [',
    "plugins: [\n    require('@tailwindcss/typography'),"
  );
  if (content === fs.readFileSync('tailwind.config.cjs', 'utf8')) {
    // maybe plugins: []
    content = content.replace(
      'plugins: []',
      "plugins: [require('@tailwindcss/typography')]"
    );
  }
  fs.writeFileSync('tailwind.config.cjs', content);
}


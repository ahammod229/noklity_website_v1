import fs from 'fs';

let css = fs.readFileSync('styles/theme.css', 'utf8');

// Fix background-light-rgb
css = css.replace('--background-light-rgb: 255 255 255;', '--background-light-rgb: 249 250 251;');

// Fix bg-gray-100 override which ruins light mode buttons
css = css.replace(/\.bg-gray-100,\n\.bg-gray-100\\\/50 \{\n  background-color: rgb\(var\(--surface-current-rgb\)\) !important;\n\}/g, '');

const darkButtonOverride = `
/* Invert dark buttons and badges in dark mode */
html.dark .bg-gray-900,
html.dark .bg-gray-800,
html.dark .bg-black {
  background-color: rgb(var(--text-dark-rgb)) !important;
  color: rgb(var(--surface-dark-rgb)) !important;
}

html.dark .bg-gray-900 .text-white,
html.dark .bg-gray-800 .text-white,
html.dark .bg-black .text-white {
  color: rgb(var(--surface-dark-rgb)) !important;
}

/* Make sure text elements that were manually set to dark gray become light in dark mode */
html.dark .text-gray-900,
html.dark .text-gray-800 {
  color: rgb(var(--text-dark-rgb)) !important;
}

/* Ensure hover states on dark buttons also invert */
html.dark .hover\\:bg-black:hover,
html.dark .hover\\:bg-gray-900:hover {
  background-color: rgb(var(--surface-light-rgb)) !important;
}
`;

if (!css.includes('/* Invert dark buttons')) {
  css += darkButtonOverride;
}

fs.writeFileSync('styles/theme.css', css);
console.log("Updated styles/theme.css");

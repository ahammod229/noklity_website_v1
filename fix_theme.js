const fs = require('fs');

let css = fs.readFileSync('styles/theme.css', 'utf8');

// Fix background-light-rgb
css = css.replace('--background-light-rgb: 255 255 255;', '--background-light-rgb: 249 250 251;');
// Keep --surface-light-rgb as 255 255 255

// Fix bg-gray-100 override which ruins light mode buttons
css = css.replace(/\.bg-gray-100,\n\.bg-gray-100\\\/50 \{\n  background-color: rgb\(var\(--surface-current-rgb\)\) !important;\n\}/g, '');

// Also, the user says dark and light theme doesn't work perfectly everywhere. 
// A major issue is black buttons in dark mode which don't invert.
// We can add a global override for dark buttons in dark mode inside theme.css
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

html.dark .text-gray-900,
html.dark .text-gray-800 {
  color: rgb(var(--text-dark-rgb)) !important;
}

/* Fix product image backgrounds to not be glaring white if not desired, or keep them surface */
`;

css += darkButtonOverride;

fs.writeFileSync('styles/theme.css', css);
console.log("Updated styles/theme.css");

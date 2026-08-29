import fs from 'fs';

let content = fs.readFileSync('components/CategoryGrid.tsx', 'utf8');

// Replace the image rendering logic
const oldImg = `{cat.logoUrl ? (
                    <img src={cat.logoUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <IconComponent className="w-4 h-4 sm:w-7 sm:h-7" strokeWidth={1.5} />
                  )}`;

const newImg = `{cat.logoUrl ? (
                    <img 
                      src={cat.logoUrl} 
                      alt={cat.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallbackIcon = e.currentTarget.nextElementSibling;
                        if (fallbackIcon) {
                          (fallbackIcon as HTMLElement).style.display = 'block';
                        }
                      }}
                    />
                  ) : null}
                  <IconComponent 
                    className="w-4 h-4 sm:w-7 sm:h-7" 
                    strokeWidth={1.5} 
                    style={{ display: cat.logoUrl ? 'none' : 'block' }}
                  />`;

content = content.replace(oldImg, newImg);
fs.writeFileSync('components/CategoryGrid.tsx', content);


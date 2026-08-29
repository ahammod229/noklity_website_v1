import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Replacements
  const replacements = [
    [/rounded-\[3rem\]/g, 'rounded-2xl'],
    [/rounded-\[2\.5rem\]/g, 'rounded-2xl'],
    [/rounded-3xl/g, 'rounded-xl'],
    [/(?<=className="[^"]*)p-20(?=[^"]*")/g, 'p-8'],
    [/(?<=className="[^"]*)py-20(?=[^"]*")/g, 'py-10'],
    [/(?<=className="[^"]*)py-16(?=[^"]*")/g, 'py-8'],
    [/(?<=className="[^"]*)py-12(?=[^"]*")/g, 'py-6'],
    [/(?<=className="[^"]*)p-16(?=[^"]*")/g, 'p-8'],
    [/(?<=className="[^"]*)p-12(?=[^"]*")/g, 'p-6'],
    [/(?<=className="[^"]*)p-10(?=[^"]*")/g, 'p-6'],
    [/(?<=className="[^"]*)p-6 md:p-8/g, 'p-4 md:p-6'],
    [/(?<=className="[^"]*)p-4 sm:p-6 md:p-8/g, 'p-4 sm:p-5 md:p-6'],
    [/(?<=className="[^"]*)p-6 sm:p-8 md:p-12/g, 'p-4 sm:p-6'],
    [/(?<=className="[^"]*)p-8/g, 'p-5'],
    [/(?<=className="[^"]*)sm:p-8/g, 'sm:p-6'],
    [/(?<=className="[^"]*)md:p-8/g, 'md:p-6'],
    [/(?<=className="[^"]*)lg:p-8/g, 'lg:p-6'],
    [/(?<=className="[^"]*)gap-12/g, 'gap-8'],
    [/(?<=className="[^"]*)gap-10/g, 'gap-6'],
    [/(?<=className="[^"]*)px-8 py-4/g, 'px-6 py-3'],
    [/(?<=className="[^"]*)px-10 py-5/g, 'px-6 py-3'],
    [/(?<=className="[^"]*)px-12 py-6/g, 'px-8 py-3'],
  ];

  for (const [regex, replacement] of replacements) {
    newContent = newContent.replace(regex, replacement);
  }

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

['pages', 'components'].forEach(dir => walkDir(dir, processFile));


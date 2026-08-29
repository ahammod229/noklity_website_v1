import fs from 'fs';

let content = fs.readFileSync('components/CategoryGrid.tsx', 'utf8');

// 1. Add isExpanded state
content = content.replace(
  "const [categories, setCategories] = useState<Category[]>(defaultCategories);",
  "const [categories, setCategories] = useState<Category[]>(defaultCategories);\n  const [isExpanded, setIsExpanded] = useState(false);"
);

// 2. Change the button
const oldButton = `<button \n            onClick={() => onSelectCategory?.('')}\n            className={\`text-sm font-bold transition-colors \${!selectedCategory ? 'text-primary' : 'text-gray-900 hover:text-primary'}\`}\n          >\n            View All\n          </button>`;

const newButton = `{categories.length > 6 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-bold transition-colors text-primary hover:text-red-700 bg-red-50 px-4 py-2 rounded-full active:scale-95"
            >
              {isExpanded ? 'Show Less' : 'View All'}
            </button>
          )}`;

content = content.replace(oldButton, newButton);

// 3. Slice the categories map
const oldMap = `{categories.map((cat) => {`;
const newMap = `{(isExpanded ? categories : categories.slice(0, 6)).map((cat) => {`;

content = content.replace(oldMap, newMap);

fs.writeFileSync('components/CategoryGrid.tsx', content);


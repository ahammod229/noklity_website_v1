import fs from 'fs';
let content = fs.readFileSync('components/admin/ProductForm.tsx', 'utf8');

// Replace Description Textarea with ReactQuill
const descRegex = /<div className="border border-gray-300 rounded focus-within:border-primary overflow-hidden">[\s\S]*?<\/div>/;
const quillDesc = `
  <div className="border border-gray-300 rounded focus-within:border-primary overflow-hidden bg-white">
    <ReactQuill 
      theme="snow"
      value={formData.description}
      onChange={(content) => setFormData({...formData, description: content})}
      className="h-[300px] mb-12"
      modules={{
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['link', 'image', 'video'],
          ['clean']
        ]
      }}
    />
  </div>
`;

// Wait, there are two of these matching descRegex (Highlights and Description).
// Let's just manually replace them based on context.

content = content.replace(/<div className="border border-gray-300 rounded focus-within:border-primary overflow-hidden">\s*<div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1 items-center">[\s\S]*?onChange=\{e => setFormData\(\{\.\.\.formData, highlights: e\.target\.value\}\)\}\s*\/>\s*<\/div>/, `
  <div className="border border-gray-300 rounded focus-within:border-primary overflow-hidden bg-white">
    <ReactQuill 
      theme="snow"
      value={formData.highlights}
      onChange={(content) => setFormData({...formData, highlights: content})}
      className="h-[150px] mb-12"
    />
  </div>
`);

content = content.replace(/<div className="border border-gray-300 rounded focus-within:border-primary overflow-hidden">\s*<div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1 items-center">[\s\S]*?onChange=\{e => setFormData\(\{\.\.\.formData, description: e\.target\.value\}\)\}\s*\/>\s*<\/div>/, quillDesc);

fs.writeFileSync('components/admin/ProductForm.tsx', content);


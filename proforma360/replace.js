const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src/components');
let count = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const oldContent = content;
  
  // Replace old input styles
  content = content.replace(/className=\"w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500\/20 focus:border-teal-500 outline-none transition-all shadow-sm bg-slate-50\/50 hover:bg-white focus:bg-white text-sm\"/g, 
    'className="w-full px-4 py-2 border border-[var(--color-outline-variant)] rounded-md focus:ring-2 focus:ring-[var(--color-primary)] outline-none"');
    
  // Replace old button styles if any specific ones need changing
  content = content.replace(/className=\"w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4 flex items-center justify-center gap-2\"/g,
    'className="w-full py-3 bg-[var(--color-primary)] hover:bg-[#003ea8] text-white rounded-md font-bold transition-all shadow-sm mt-4 flex items-center justify-center gap-2"');
    
  // Replace section styles
  content = content.replace(/className=\"dashboard-section border-none shadow-sm\"/g,
    'className="bg-white p-6 md:p-8 rounded-[var(--radius-lg)] elevation-1 border border-[var(--color-outline-variant)]"');

  if (content !== oldContent) {
    fs.writeFileSync(f, content);
    count++;
    console.log('Updated ' + f);
  }
});
console.log('Total files updated: ' + count);

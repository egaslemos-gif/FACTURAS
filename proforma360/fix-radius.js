const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('e:\\PROJECTOS IA\\FACTURAS\\FACTURAS\\proforma360\\src', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/rounded-xl/g, 'rounded-md');
    content = content.replace(/rounded-lg/g, 'rounded-md');
    content = content.replace(/rounded-2xl/g, 'rounded-lg');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});

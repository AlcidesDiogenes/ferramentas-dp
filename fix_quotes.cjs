const fs = require('fs');

function walkSync(dir, filelist = []) {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = dir + '/' + file;
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) { }
  });
  return filelist;
}

const files = walkSync('.').filter(f => f.endsWith('.js'));

files.forEach(f => {
  if (f.includes('node_modules') || f.includes('.vscode') || f.includes('assets')) return;

  let content = fs.readFileSync(f, 'utf8');
  let originalContent = content;

  // Replace ' \n<svg with '<svg
  content = content.replace(/'\s*\n\s*<svg/g, "'<svg");
  // Replace </svg>\n ' with </svg> '
  content = content.replace(/<\/svg>\s*\n\s*/g, "</svg> ");
  // Also fix "
  content = content.replace(/"\s*\n\s*<svg/g, '"<svg');

  if (content !== originalContent) {
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Fixed quotes in ${f}`);
  }
});

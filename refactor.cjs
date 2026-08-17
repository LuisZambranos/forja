const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, 'src/ui');

function refactorFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace deep nested relatives
  content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/shared\/data\/motivationalPhrases/g, '$1@core/services/motivational.service');
  content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/hooks/g, '$1@ui/hooks');
  content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/shared\/utils\/imageUpload/g, '$1@core/services/storage.service');
  content = content.replace(/(['"])\.\.\/\.\.\/\.\.\/components/g, '$1@ui/components');

  // Relatives -> @ui
  content = content.replace(/(['"])\.\.\/\.\.\/components/g, '$1@ui/components');
  content = content.replace(/(['"])\.\.\/components/g, '$1@ui/components');
  content = content.replace(/(['"])\.\.\/\.\.\/features/g, '$1@ui/features');
  content = content.replace(/(['"])\.\.\/features/g, '$1@ui/features');
  content = content.replace(/(['"])\.\.\/\.\.\/hooks/g, '$1@ui/hooks');
  content = content.replace(/(['"])\.\.\/hooks/g, '$1@ui/hooks');
  content = content.replace(/(['"])\.\.\/utils/g, '$1@ui/features/dashboard/utils'); // Para streakUtils

  // Relatives -> @core
  content = content.replace(/(['"])\.\.\/\.\.\/shared\/types(\/index)?/g, '$1@core/models');
  content = content.replace(/(['"])\.\.\/shared\/types(\/index)?/g, '$1@core/models');
  content = content.replace(/(['"])\.\.\/\.\.\/shared\/firebase\/config/g, '$1@core/config/firebase');
  content = content.replace(/(['"])\.\.\/shared\/firebase\/config/g, '$1@core/config/firebase');
  content = content.replace(/(['"])\.\.\/\.\.\/shared\/utils\/imageUpload/g, '$1@core/services/storage.service');
  content = content.replace(/(['"])\.\.\/shared\/utils\/imageUpload/g, '$1@core/services/storage.service');
  content = content.replace(/(['"])\.\.\/\.\.\/shared\/data\/motivationalPhrases/g, '$1@core/services/motivational.service');
  content = content.replace(/(['"])\.\.\/shared\/data\/motivationalPhrases/g, '$1@core/services/motivational.service');

  // App.tsx relatives
  content = content.replace(/(['"])\.\/components/g, '$1@ui/components');
  content = content.replace(/(['"])\.\/features/g, '$1@ui/features');
  content = content.replace(/(['"])\.\/hooks/g, '$1@ui/hooks');

  fs.writeFileSync(filePath, content, 'utf8');
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      traverse(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      refactorFile(p);
    }
  }
}

traverse(UI_DIR);
traverse(path.join(__dirname, 'src/core'));
refactorFile(path.join(__dirname, 'src/App.tsx'));
refactorFile(path.join(__dirname, 'src/main.tsx'));

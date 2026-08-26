import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
  if (!importMatch) return;
  const imported = importMatch[1].split(',').map(s => {
    const trimmed = s.trim();
    if (trimmed.includes(' as ')) return trimmed.split(' as ')[1].trim();
    return trimmed;
  }).filter(Boolean);
  
  const tags = Array.from(new Set(Array.from(content.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)).map(m => m[1])));
  const nonIcons = ['React', 'Fragment', 'OptimizedImage', 'Navbar', 'Footer', 'HeroCarousel', 'CategoryShelf', 'ProductModal', 'AdminDashboard', 'CatalogPage', 'CategoryGalleryPage', 'AboutPage', 'CustomPosterPage', 'OFFICIAL_SIZES'];
  const missing = tags.filter(t => !nonIcons.includes(t) && !imported.includes(t));
  if (missing.length > 0) {
    console.log(`❌ ${filePath} is missing Lucide imports:`, missing);
  } else {
    console.log(`✅ ${filePath} all imports present.`);
  }
}

const dir = './src';
function scan(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) scan(p);
    else if (p.endsWith('.jsx') || p.endsWith('.js')) checkFile(p);
  }
}

scan(dir);

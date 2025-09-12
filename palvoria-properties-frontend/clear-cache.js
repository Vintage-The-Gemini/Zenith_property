#!/usr/bin/env node

// Cache clearing utility script
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧹 Clearing all caches...');

// Update cache busting timestamp in index.html
const indexPath = path.join(__dirname, 'index.html');
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  const timestamp = Date.now();
  
  // Update favicon cache busting
  indexContent = indexContent.replace(
    /palvoria-logo\.png\?v=\d+/g,
    `palvoria-logo.png?v=${timestamp}`
  );
  
  // Update manifest cache busting
  indexContent = indexContent.replace(
    /site\.webmanifest\?v=\d+/g,
    `site.webmanifest?v=${timestamp}`
  );
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Updated cache busting timestamps in index.html');
}

// Clear Vite cache directories
const cacheDirs = [
  path.join(__dirname, 'node_modules/.vite'),
  path.join(__dirname, '.vite'),
  path.join(__dirname, 'dist')
];

cacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✅ Cleared ${path.basename(dir)} cache`);
  }
});

console.log('🎉 Cache clearing complete!');
console.log('💡 Now restart your dev server: npm run dev');
console.log('💡 In browser: Press Ctrl+Shift+R (or Cmd+Shift+R) for hard refresh');
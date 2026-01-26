#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixImports(dir) {
  const files = await readdir(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = join(dir, file.name);
    
    if (file.isDirectory()) {
      await fixImports(fullPath);
    } else if (file.name.endsWith('.js') && !file.name.endsWith('.d.ts')) {
      let content = await readFile(fullPath, 'utf-8');
      
      // Fix relative imports that don't have .js extension
      content = content.replace(
        /from\s+['"](\.\.?\/[^'"]+)['"]/g,
        (match, importPath) => {
          // Skip if already has extension or is a package import
          if (importPath.includes('.js') || importPath.startsWith('@') || !importPath.startsWith('.')) {
            return match;
          }
          return match.replace(importPath, importPath + '.js');
        }
      );
      
      await writeFile(fullPath, content, 'utf-8');
    }
  }
}

const distDir = join(__dirname, 'dist');
await fixImports(distDir);
console.log('✓ Fixed import paths in compiled files');


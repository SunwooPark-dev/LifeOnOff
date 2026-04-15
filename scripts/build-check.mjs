import { readFile } from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'public/index.html',
  'public/styles.css',
  'src/ui/app.js',
  'src/ui/render.js',
  'src/core/config.js',
  'src/core/validation.js',
  'src/core/normalize.js',
  'src/core/run-simulation.js',
  'src/core/simulator.js',
  'src/core/report.js',
  'src/core/static-server.js',
  'src/core/storage.js',
  'server.js'
];

for (const file of requiredFiles) {
  await readFile(path.join(process.cwd(), file), 'utf8');
}

const html = await readFile(path.join(process.cwd(), 'public', 'index.html'), 'utf8');
if (!html.includes('/src/ui/app.js')) {
  throw new Error('public/index.html must include /src/ui/app.js');
}

console.log('Build check passed.');

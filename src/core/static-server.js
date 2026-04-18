import path from 'node:path';

function normalizeRequestPath(urlPath) {
  try {
    const rawPath = decodeURIComponent(String(urlPath || '/'));
    if (rawPath.includes('..') || rawPath.includes('\\')) {
      return null;
    }
    const parsed = new URL(urlPath || '/', 'http://localhost');
    return decodeURIComponent(parsed.pathname);
  } catch {
    return null;
  }
}

function isWithinRoot(candidate, allowedRoot) {
  const normalizedCandidate = path.normalize(candidate);
  const normalizedRoot = path.normalize(allowedRoot);
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(`${normalizedRoot}${path.sep}`);
}

export function resolveStaticFilePath(urlPath, { rootDir = process.cwd() } = {}) {
  const pathname = normalizeRequestPath(urlPath);
  if (!pathname) return null;

  const publicRoot = path.join(rootDir, 'public');
  const srcRoot = path.join(rootDir, 'src');

  if (pathname === '/' || pathname === '/index.html') {
    return path.join(publicRoot, 'index.html');
  }

  if (pathname.startsWith('/src/')) {
    const candidate = path.join(rootDir, pathname.slice(1));
    return isWithinRoot(candidate, srcRoot) ? candidate : null;
  }

  const candidate = path.join(publicRoot, pathname.replace(/^\/+/, ''));
  return isWithinRoot(candidate, publicRoot) ? candidate : null;
}

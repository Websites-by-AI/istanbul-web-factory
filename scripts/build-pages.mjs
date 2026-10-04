import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workerBase = process.env.WORKER_BASE_URL;
if (!workerBase) throw new Error('Set the repository variable WORKER_BASE_URL to the public HTTPS origin of the Cloudflare Worker.');
let workerUrl;
try { workerUrl = new URL(workerBase); }
catch { throw new Error('WORKER_BASE_URL must be a valid HTTPS origin.'); }
if (workerUrl.protocol !== 'https:' || workerUrl.username || workerUrl.password || workerUrl.pathname !== '/' || workerUrl.search || workerUrl.hash) {
  throw new Error('WORKER_BASE_URL must be an HTTPS origin only, without credentials, path, query, or fragment.');
}
const output = path.join(root, '_site');
await fs.rm(output, { recursive: true, force: true });
await fs.cp(path.join(root, 'public'), output, { recursive: true });
// Shareable previews are served by the Worker, not from GitHub Pages' static project path.
await Promise.all([
  fs.rm(path.join(output, 'preview.html'), { force: true }),
  fs.rm(path.join(output, 'preview.js'), { force: true }),
]);
await fs.writeFile(path.join(output, 'app-config.js'), `window.APP_CONFIG = Object.freeze({ apiBaseUrl: ${JSON.stringify(workerUrl.origin)} });\n`, 'utf8');
console.log(`Built GitHub Pages frontend; API and previews point to ${workerUrl.origin}`);

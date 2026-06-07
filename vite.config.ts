import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { writeFileSync } from 'fs'
import type { Plugin } from 'vite'

function fileApiPlugin(): Plugin {
  return {
    name: 'nutrichain-file-api',
    configureServer(server) {
      function handleSave(filePath: string) {
        return (req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              writeFileSync(filePath, JSON.stringify(JSON.parse(body), null, 2) + '\n');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
        };
      }
      server.middlewares.use('/api/save-rules',  handleSave(path.resolve(__dirname, 'src/rules.json')));
      server.middlewares.use('/api/save-schema', handleSave(path.resolve(__dirname, 'src/facts-schema.json')));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), fileApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})

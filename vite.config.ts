import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, path.resolve(), '');
    
    // Resolve API Key: Check API_KEY first (standard), then GEMINI_API_KEY
    const apiKey = env.API_KEY || env.GEMINI_API_KEY;

    return {
        base: '/VIEW-CAMERA/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Inject the resolved key into process.env.API_KEY for the app to use
        'process.env.API_KEY': JSON.stringify(apiKey),
        // Keep strictly for compatibility if referenced directly elsewhere (optional)
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

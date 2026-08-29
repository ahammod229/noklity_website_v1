import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: 'all',
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true
          }
        }
      },
      plugins: [react()],
      build: {
        chunkSizeWarningLimit: 700,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                  return 'react-vendor';
                }
                if (id.includes('@supabase')) {
                  return 'supabase-vendor';
                }
                if (id.includes('framer-motion') || id.includes('lucide-react')) {
                  return 'ui-vendor';
                }
                return 'vendor';
              }

              return undefined;
            }
          }
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

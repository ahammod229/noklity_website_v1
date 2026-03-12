import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
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

              if (id.includes('/pages/admin/') || id.includes('/components/admin/')) {
                return 'admin-pages';
              }

              if (id.includes('/pages/customer/') || id.includes('/components/customer/')) {
                return 'customer-pages';
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

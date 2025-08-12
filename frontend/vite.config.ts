import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { splitVendorChunkPlugin } from 'vite';

// Custom plugin to inject "built by scout" tag
function injectBuiltByScoutPlugin() {
  return {
    name: 'inject-built-by-scout',
    transformIndexHtml(html: string) {
      // Inject the scout tag script reference
      const scriptTag = '<script defer src="/scout-tag.js"></script>';
      
      // Inject the script before the closing body tag
      return html.replace('</body>', scriptTag + '\n  </body>');
    }
  };
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react({
        // Enable React Fast Refresh in development
        fastRefresh: !isProduction,
      }),
      tailwindcss(),
      injectBuiltByScoutPlugin(),
      // Split vendor chunks for better caching
      splitVendorChunkPlugin()
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Production build optimizations
      target: 'es2015',
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isProduction ? false : true,
      minify: isProduction ? 'terser' : false,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : {},
      
      // Rollup options for better tree shaking
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // React and React DOM
            'react-vendor': ['react', 'react-dom'],
            // UI components
            'ui-vendor': ['@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-avatar'],
            // Utilities
            'utils-vendor': ['lucide-react', 'class-variance-authority', 'clsx'],
          },
          // Asset naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
    },
    
    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: !process.env.CI,
      cors: true,
      // Proxy API calls in development
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api/v1')
        },
        '/ws': {
          target: env.VITE_WS_BASE_URL || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true
        }
      }
    },
    
    // Preview server configuration (for production preview)
    preview: {
      port: 4173,
      host: true,
      cors: true
    },
    
    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // Dependency optimization
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'lucide-react'
      ],
      exclude: [
        // Exclude any problematic dependencies
      ]
    },
  };
});

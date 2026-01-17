
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';

  export default defineConfig({
    // Explicitly set public directory - files here are served at root path
    publicDir: 'public',
    plugins: [
      react(),
      // No custom plugins - let Vite handle everything naturally
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Source map configuration
    // Enable source maps in dev mode so Vite can serve source files when requested
    // This allows DevTools and error traces to access source files properly
    css: {
      devSourcemap: true,  // Enable CSS source maps in dev (allows source file serving)
    },
    esbuild: {
      // Enable source maps in dev mode (allows Vite to serve source files)
      sourcemap: true,
    },
    build: {
      target: 'esnext',
      outDir: 'build',
      // Disable source maps in production to prevent source file requests
      sourcemap: false,
    },
    server: {
      host: '0.0.0.0',  // Allow external connections (for Docker)
      port: 3000,
      open: false,  // Don't auto-open in Docker
      strictPort: false,  // Allow port fallback if 3000 is taken
      allowedHosts: [
        'ventureuplink.com',  // Allow requests from the production domain
        'www.ventureuplink.com',  // Allow www subdomain
        'backend.ventureuplink.com',  // Allow requests from the backend API domain
        'localhost',  // Allow localhost for local development
      ],
      // Configure proxy for proper handling of requests via reverse proxy
      // This ensures Vite handles requests correctly when accessed via domain
      proxy: {},
      // Configure HMR WebSocket connection for reverse proxy setup
      // When accessed via domain (ventureuplink.com), HMR WebSocket needs proper configuration
      hmr: {
        // Server-side WebSocket port (internal Docker port)
        port: 3000,
        // Client-side: When behind reverse proxy, use the same host as the page (no port in URL)
        // For https://ventureuplink.com, WebSocket should connect to wss://ventureuplink.com (port 443)
        // NOT wss://ventureuplink.com:3000
        // When accessed via domain, detect protocol and use standard ports
        host: undefined,  // Auto-detect from X-Forwarded-Host header or window.location.hostname
        // Use the same port as the page (443 for HTTPS, 80 for HTTP) - no port in URL
        // This prevents WebSocket from trying to connect to port 3000 when accessed via domain
        clientPort: undefined,  // Will use browser's port (443 for HTTPS, 80 for HTTP) - no port in URL
        protocol: undefined,  // Auto-detect: wss for HTTPS, ws for HTTP
        // IMPORTANT: Your reverse proxy must:
        // 1. Forward WebSocket upgrade requests (Connection: Upgrade, Upgrade: websocket)
        // 2. Set X-Forwarded-Proto and X-Forwarded-Host headers
        // 3. Handle the WebSocket connection upgrade properly
        // 4. The reverse proxy should serve on standard ports (80 for HTTP, 443 for HTTPS)
      },
      watch: {
        usePolling: true,  // Enable polling for file changes in Docker
      },
      // File system access configuration
      // Allow Vite to serve source files in dev mode (needed for source file requests)
      fs: {
        // Allow serving files from project root and parent directories
        allow: ['..'],
        // Don't deny any files - let Vite handle source file serving naturally
        deny: [],
      },
    },
  });
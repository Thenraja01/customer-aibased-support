import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
          'vendor-ui': ['lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts'],
          'vendor-query': ['@tanstack/react-query', 'axios'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3030',
      '/users': 'http://localhost:3030',
      '/chats': 'http://localhost:3030',
      '/public': 'http://localhost:3030',
      '/messages': 'http://localhost:3030',
      '/tickets': 'http://localhost:3030',
      '/ticket-templates': 'http://localhost:3030',
      '/notifications': 'http://localhost:3030',
      '/documents': 'http://localhost:3030',
      '/document-verifications': 'http://localhost:3030',
      '/organizations': 'http://localhost:3030',
      '/branches': 'http://localhost:3030',
      '/document-types': 'http://localhost:3030',
      '/ai-sessions': 'http://localhost:3030',
      '/audit-logs': 'http://localhost:3030',
      '/faqs': 'http://localhost:3030',
      '/rag': 'http://localhost:3030',
      '/memory': 'http://localhost:3030',
      '/knowledge-gaps': 'http://localhost:3030',
      '/knowledge-graph': 'http://localhost:3030',
      '/knowledge-nodes': 'http://localhost:3030',
      '/topics': 'http://localhost:3030',
      '/admin': 'http://localhost:3030',
      '/search': 'http://localhost:3030',
      '/ai': 'http://localhost:3030',
      '/feedback': 'http://localhost:3030',
      '/agent': 'http://localhost:3030',
      '/api': 'http://localhost:3030',
      '/widget': 'http://localhost:3030',
      '/uploads': 'http://localhost:3030',
      '/socket.io': {
        target: 'http://localhost:3030',
        ws: true,
      },
    },
    // @ts-ignore
    allowedHosts: [
      'jeeva.localfix.app',
      'platform.localfix.app',
      '.localfix.app',
      '.trycloudflare.com',
      '.cloudflare.com',
      'keg-uranium-overstate.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok-free.app',
      '.ngrok.app',
      '.ngrok.dev',
      'localhost',
    ],
  },
});

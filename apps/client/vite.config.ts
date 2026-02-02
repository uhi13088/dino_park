import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@game': path.resolve(__dirname, './src/game'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@api': path.resolve(__dirname, './src/api'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 청크 크기 경고 한도 (500KB)
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // 코드 스플리팅 최적화
        manualChunks: {
          // React 코어
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 상태 관리
          'state-vendor': ['zustand', '@tanstack/react-query'],
          // 게임 엔진
          'pixi-vendor': ['pixi.js'],
          // UI 라이브러리
          'ui-vendor': ['framer-motion', 'clsx', 'tailwind-merge'],
        },
        // 에셋 파일 정리
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },
    // 압축 최적화
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // 개발 모드 최적화
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'pixi.js'],
  },
});

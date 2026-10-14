import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Le SDK Firebase « compat » (syntaxe v8) est volumineux : ~240 ko compressés.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
} as never);

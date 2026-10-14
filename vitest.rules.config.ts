import { defineConfig } from 'vitest/config';

// Tests des règles de sécurité : exécutés contre l'émulateur Firebase
// via `npm run test:regles`.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    fileParallelism: false,
  },
});

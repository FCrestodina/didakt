import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: { environment: 'node' },
  // Mismo alias que tsconfig: en este repo `@` es la raíz, no `src/`.
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
});

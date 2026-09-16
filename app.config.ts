import { defineConfig } from '@tanstack/start/config';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  tsr: {
    appDirectory: 'app',
    routesDirectory: 'app/routes',
    generatedRouteTree: 'app/routeTree.gen.ts',
    routeFileIgnorePattern: '',
    quoteStyle: 'single',
  },
  vite: {
    plugins: [
      viteTsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
    ],
    optimizeDeps: {
      exclude: ['better-sqlite3'],
    },
    build: {
      target: 'es2022',
    },
  },
  server: {
    preset: 'node-server',
  },
});

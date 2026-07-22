import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE && visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});

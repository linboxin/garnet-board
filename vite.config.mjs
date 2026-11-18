// Settings for Vite, the tool that runs and builds the React app.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // The React app lives in the client/ folder.
  root: 'client',

  // `npm run build` puts the finished website in dist/.
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },

  // While developing, the React app runs on port 5173 and the Express server
  // on port 3000. This forwards the app's /api requests to the server.
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});

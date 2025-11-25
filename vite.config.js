import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true
    },
    define: {
      '__VITE_WS_SERVER_URL__': JSON.stringify(env.VITE_WS_SERVER_URL)
    }
  };
})

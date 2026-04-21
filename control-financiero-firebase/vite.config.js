import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
export default defineConfig({
    base: './',
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    if (id.includes('firebase')) {
                        return 'firebase';
                    }
                    if (id.includes('react-router')) {
                        return 'router';
                    }
                    if (id.includes('react')) {
                        return 'react-vendor';
                    }
                    return 'vendor';
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

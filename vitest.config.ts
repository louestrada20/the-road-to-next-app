import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    },
    exclude: [
      'node_modules/**',
      'e2e/**',
      '**/*.spec.ts'
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        'src/components/ui/**', // Exclude ShadCN UI components
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/paths': path.resolve(__dirname, './src/paths'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/actions': path.resolve(__dirname, './src/actions'),
      '@/emails': path.resolve(__dirname, './src/emails'),
    },
  },
})

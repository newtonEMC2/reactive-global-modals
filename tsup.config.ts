import { defineConfig } from 'tsup'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig([
  // Main JS bundle with CSS injection
  {
    entry: ['src/index.tsx'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: !isProduction, // Source maps only in dev
    clean: true,
    external: ['react', 'react-dom'],
    treeshake: true,
    minify: isProduction, // Minify only in production
    target: 'es2020',
    // CSS handling
    injectStyle: true, // Inject CSS as JavaScript that adds styles to document head
    loader: {
      '.css': 'css', // Handle CSS files
    },
    ...(isProduction
      ? {}
      : {
          skipNodeModulesBundle: true,
        }),
    ...(isProduction
      ? {
          treeshake: { preset: 'smallest' },
        }
      : {}),
  },
  // Separate CSS file export
  {
    entry: {
      'composable-modal': 'src/lib/composable-modal.module.css',
    },
    outDir: 'dist',
    clean: false, // Don't clean since main build already did
    minify: isProduction,
    loader: {
      '.css': 'copy', // Copy CSS file as-is
    },
  },
])

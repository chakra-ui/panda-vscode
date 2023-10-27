import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  watch: ['../language-server/src/**/*', '../ts-plugin/src/**/*', '../shared/src/**/*'],
  format: ['cjs'],
  external: ['vscode', 'esbuild'],
  minify: false,
  outDir: 'dist',
  clean: true,
  shims: true,
})

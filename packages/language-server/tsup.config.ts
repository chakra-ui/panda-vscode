import { copyFile } from 'fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  external: ['esbuild', 'lightningcss'],
  minify: true,
  outDir: 'dist',
  clean: true,
  shims: true,
  onSuccess() {
    console.log('✅ Build complete!')
    copyFile('./dist/index.js', '../vscode/dist/server.js', (err) => {
      if (err) throw err
      console.log('✅ Server.js copied to vscode/dist')
    })

    return Promise.resolve()
  },
})

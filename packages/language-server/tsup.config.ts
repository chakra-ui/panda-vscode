import { copyFile } from 'fs'
import { resolve } from 'path'
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
    copyFile(resolve(__dirname, './dist/index.js'), resolve(__dirname, '../vscode/dist/server.js'), (err) => {
      if (err) return console.warn(err)
      console.log('✅ Server.js copied to vscode/dist')
    })

    return Promise.resolve()
  },
})

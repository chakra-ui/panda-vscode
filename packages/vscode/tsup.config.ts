import path from 'path'
import { defineConfig } from 'tsup'

const aliases = {
  '@vue/compiler-sfc': '@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js',
  lightningcss: 'lightningcss-wasm/index.mjs',
}

const nodeModulesPath = path.resolve(__dirname, 'node_modules')

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['cjs'],
  external: ['vscode', 'esbuild', 'lightningcss', '@vue/compiler-sfc'],
  minify: true,
  outDir: 'dist',
  clean: true,
  shims: true,
  esbuildPlugins: [
    {
      name: 'resolve-alias-plugin',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          for (const alias in aliases) {
            if (args.path.startsWith(alias)) {
              const updated = path.resolve(nodeModulesPath, aliases[alias])

              return { path: updated }
            }
          }
          return null
        })
      },
    },
  ],
})

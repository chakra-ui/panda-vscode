import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // Whether to use css reset
  preflight: true,

  // Where to look for your css declarations
  include: ['./src/**/*.{js,jsx,ts,tsx}', './pages/**/*.{js,jsx,ts,tsx}'],

  // Files to exclude
  exclude: [],

  // Useful for theme customization
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          app: {
            background: { value: '#fef08a' },
            foreground: { value: '{colors.yellow.300}' },
            text: {
              value: {
                _base: '{colors.blue.100}',
                _light: '{colors.blue.200}',
                _dark: '{colors.blue.300}',
              },
            },
          },
        },
      },
    },
  },

  // The output directory for your css system
  outdir: 'styled-system',

  // The JSX framework to use
  jsxFramework: 'react',
})

import { defineConfig } from '@pandacss/dev'
import { button} from "./src/button.recipe"

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
      recipes: {
        button,
      },
      semanticTokens: {
        colors: {
          danger: {
            value: { base: '{colors.red.300}', _dark: '{colors.orange.300}' },
          },
          success: {
            value: { base: '{colors.green.300}', _dark: '{colors.lime.400}' },
          },
          bg: {
            DEFAULT: { value: '{colors.yellow.100}' },
            muted: { value: '{colors.gray.100}' },
            text: {
              value: {
                base: '{colors.blue.100}',
                _light: '{colors.blue.200}',
                _dark: '{colors.blue.300}',
                md: {
                  base: '{colors.blue.900}',
                  _focus: '{colors.blue.400}',
                  _active: '{colors.blue.500}',
                  _hover: {
                    base: '{colors.blue.600}',
                    _light: '{colors.blue.700}',
                    _dark: '{colors.blue.800}',
                  }
                }
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

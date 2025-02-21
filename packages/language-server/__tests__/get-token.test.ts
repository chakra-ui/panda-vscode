import { expect, test } from 'vitest'
import { getTokenFromPropValue } from '../src/tokens/get-token'
import { createContext } from './fixtures'

test('display: block', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'display', 'block')).toMatchInlineSnapshot(`undefined`)
})

test('zIndex: 1', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'zIndex', '1')).toMatchInlineSnapshot(`undefined`)
})

test('margin: 2', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'margin', '2')).toMatchInlineSnapshot(`
    _Token {
      "description": undefined,
      "extensions": {
        "category": "spacing",
        "condition": "base",
        "pixelValue": "8px",
        "prop": "2",
        "var": "--spacing-2",
        "varRef": "var(--spacing-2)",
      },
      "name": "spacing.2",
      "originalValue": "0.5rem",
      "path": [
        "spacing",
        "2",
      ],
      "type": "dimension",
      "value": "0.5rem",
    }
  `)
})

test('CSS var', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, '--btn-color', 'colors.gray.300')).toMatchInlineSnapshot(`undefined`)
})

test('token reference with curly braces', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'border', '{colors.gray.300}')).toMatchInlineSnapshot(`
    {
      "extensions": {
        "kind": "invalid-token-path",
      },
      "name": "{colors.gray.300}",
      "path": "borders.{colors.gray.300}",
      "type": "color",
      "value": "{colors.gray.300}",
    }
  `)
})

// test('composite value with token reference with token()', () => {
//   const ctx = createContext()
//   expect(getTokenFromPropValue(ctx, 'border', '1px solid {colors.gray.300}')).toMatchInlineSnapshot(`
//     _Token {
//       "description": undefined,
//       "extensions": {
//         "category": "colors",
//         "colorPalette": "gray",
//         "colorPaletteRoots": [
//           [
//             "gray",
//           ],
//         ],
//         "colorPaletteTokenKeys": [
//           [
//             "300",
//           ],
//         ],
//         "condition": "base",
//         "kind": "semantic-color",
//         "prop": "gray.300",
//         "var": "--colors-gray-300",
//         "varRef": "var(--colors-gray-300)",
//         "vscodeColor": {
//           "alpha": 1,
//           "blue": 0.8588235294117647,
//           "green": 0.8352941176470589,
//           "red": 0.8196078431372549,
//         },
//       },
//       "name": "colors.gray.300",
//       "originalValue": "#d1d5db",
//       "path": [
//         "colors",
//         "gray",
//         "300",
//       ],
//       "type": "color",
//       "value": "#d1d5db",
//     }
//   `)
// })

test('token reference with token()', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'border', '1px solid token(colors.gray.300)')).toMatchInlineSnapshot(`
    _Token {
      "description": undefined,
      "extensions": {
        "category": "colors",
        "colorPalette": "gray",
        "colorPaletteRoots": [
          [
            "gray",
          ],
        ],
        "colorPaletteTokenKeys": [
          [
            "300",
          ],
        ],
        "condition": "base",
        "kind": "semantic-color",
        "prop": "gray.300",
        "var": "--colors-gray-300",
        "varRef": "var(--colors-gray-300)",
        "vscodeColor": {
          "alpha": 1,
          "blue": 0.8588235294117647,
          "green": 0.8352941176470589,
          "red": 0.8196078431372549,
        },
      },
      "name": "colors.gray.300",
      "originalValue": "#d1d5db",
      "path": [
        "colors",
        "gray",
        "300",
      ],
      "type": "color",
      "value": "#d1d5db",
    }
  `)
})

test('fontSize: xl', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'fontSize', 'xl')).toMatchInlineSnapshot(`
    _Token {
      "description": undefined,
      "extensions": {
        "category": "fontSizes",
        "condition": "base",
        "pixelValue": "20px",
        "prop": "xl",
        "var": "--font-sizes-xl",
        "varRef": "var(--font-sizes-xl)",
      },
      "name": "fontSizes.xl",
      "originalValue": "1.25rem",
      "path": [
        "fontSizes",
        "xl",
      ],
      "type": "fontSize",
      "value": "1.25rem",
    }
  `)
})

test('color: #fff', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'color', '#fff')).toMatchInlineSnapshot(`
    {
      "extensions": {
        "kind": "native-color",
        "vscodeColor": {
          "alpha": 1,
          "blue": 1,
          "green": 1,
          "red": 1,
        },
      },
      "name": "#fff",
      "path": "colors.#fff",
      "type": "color",
      "value": "#fff",
    }
  `)
})

test('width: xs', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'width', 'xs')).toMatchInlineSnapshot(`
    _Token {
      "description": undefined,
      "extensions": {
        "category": "sizes",
        "condition": "base",
        "pixelValue": "320px",
        "prop": "xs",
        "var": "--sizes-xs",
        "varRef": "var(--sizes-xs)",
      },
      "name": "sizes.xs",
      "originalValue": "20rem",
      "path": [
        "sizes",
        "xs",
      ],
      "type": undefined,
      "value": "20rem",
    }
  `)
})

test('color: green', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'color', 'green')).toMatchInlineSnapshot(`
    {
      "extensions": {
        "kind": "native-color",
        "vscodeColor": {
          "alpha": 1,
          "blue": 0,
          "green": 0.5019607843137255,
          "red": 0,
        },
      },
      "name": "green",
      "path": "colors.green",
      "type": "color",
      "value": "green",
    }
  `)
})

test('color: blue.300', () => {
  const ctx = createContext()
  expect(getTokenFromPropValue(ctx, 'color', 'blue.300')).toMatchInlineSnapshot(`
    _Token {
      "description": undefined,
      "extensions": {
        "category": "colors",
        "colorPalette": "blue",
        "colorPaletteRoots": [
          [
            "blue",
          ],
        ],
        "colorPaletteTokenKeys": [
          [
            "300",
          ],
        ],
        "condition": "base",
        "kind": "color",
        "prop": "blue.300",
        "var": "--colors-blue-300",
        "varRef": "var(--colors-blue-300)",
        "vscodeColor": {
          "alpha": 1,
          "blue": 0.9921568627450981,
          "green": 0.7725490196078432,
          "red": 0.5764705882352941,
        },
      },
      "name": "colors.blue.300",
      "originalValue": "#93c5fd",
      "path": [
        "colors",
        "blue",
        "300",
      ],
      "type": "color",
      "value": "#93c5fd",
    }
  `)
})

import { expect, test } from 'vitest'
import { getCompletionFor } from '../src/completion-provider'
import { createContext } from './fixtures'

test('display: block', () => {
  const ctx = createContext()
  expect(getCompletionFor({ ctx, propName: 'color', propValue: 'blu', settings: {} })).toMatchInlineSnapshot(`
    [
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "50",
                ],
              ],
              "condition": "base",
              "prop": "blue.50",
              "var": "--colors-blue-50",
              "varRef": "var(--colors-blue-50)",
            },
            "name": "colors.blue.50",
            "originalValue": "#eff6ff",
            "path": [
              "colors",
              "blue",
              "50",
            ],
            "type": "color",
            "value": "#eff6ff",
          },
        },
        "detail": "#eff6ff",
        "kind": 16,
        "label": "blue.50",
        "labelDetails": {
          "description": "#eff6ff",
          "detail": "   var(--colors-blue-50)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000050",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "100",
                ],
              ],
              "condition": "base",
              "prop": "blue.100",
              "var": "--colors-blue-100",
              "varRef": "var(--colors-blue-100)",
            },
            "name": "colors.blue.100",
            "originalValue": "#dbeafe",
            "path": [
              "colors",
              "blue",
              "100",
            ],
            "type": "color",
            "value": "#dbeafe",
          },
        },
        "detail": "#dbeafe",
        "kind": 16,
        "label": "blue.100",
        "labelDetails": {
          "description": "#dbeafe",
          "detail": "   var(--colors-blue-100)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000100",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "200",
                ],
              ],
              "condition": "base",
              "prop": "blue.200",
              "var": "--colors-blue-200",
              "varRef": "var(--colors-blue-200)",
            },
            "name": "colors.blue.200",
            "originalValue": "#bfdbfe",
            "path": [
              "colors",
              "blue",
              "200",
            ],
            "type": "color",
            "value": "#bfdbfe",
          },
        },
        "detail": "#bfdbfe",
        "kind": 16,
        "label": "blue.200",
        "labelDetails": {
          "description": "#bfdbfe",
          "detail": "   var(--colors-blue-200)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000200",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
              "prop": "blue.300",
              "var": "--colors-blue-300",
              "varRef": "var(--colors-blue-300)",
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
          },
        },
        "detail": "#93c5fd",
        "kind": 16,
        "label": "blue.300",
        "labelDetails": {
          "description": "#93c5fd",
          "detail": "   var(--colors-blue-300)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000300",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "400",
                ],
              ],
              "condition": "base",
              "prop": "blue.400",
              "var": "--colors-blue-400",
              "varRef": "var(--colors-blue-400)",
            },
            "name": "colors.blue.400",
            "originalValue": "#60a5fa",
            "path": [
              "colors",
              "blue",
              "400",
            ],
            "type": "color",
            "value": "#60a5fa",
          },
        },
        "detail": "#60a5fa",
        "kind": 16,
        "label": "blue.400",
        "labelDetails": {
          "description": "#60a5fa",
          "detail": "   var(--colors-blue-400)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000400",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "500",
                ],
              ],
              "condition": "base",
              "prop": "blue.500",
              "var": "--colors-blue-500",
              "varRef": "var(--colors-blue-500)",
            },
            "name": "colors.blue.500",
            "originalValue": "#3b82f6",
            "path": [
              "colors",
              "blue",
              "500",
            ],
            "type": "color",
            "value": "#3b82f6",
          },
        },
        "detail": "#3b82f6",
        "kind": 16,
        "label": "blue.500",
        "labelDetails": {
          "description": "#3b82f6",
          "detail": "   var(--colors-blue-500)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000500",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "600",
                ],
              ],
              "condition": "base",
              "prop": "blue.600",
              "var": "--colors-blue-600",
              "varRef": "var(--colors-blue-600)",
            },
            "name": "colors.blue.600",
            "originalValue": "#2563eb",
            "path": [
              "colors",
              "blue",
              "600",
            ],
            "type": "color",
            "value": "#2563eb",
          },
        },
        "detail": "#2563eb",
        "kind": 16,
        "label": "blue.600",
        "labelDetails": {
          "description": "#2563eb",
          "detail": "   var(--colors-blue-600)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000600",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "700",
                ],
              ],
              "condition": "base",
              "prop": "blue.700",
              "var": "--colors-blue-700",
              "varRef": "var(--colors-blue-700)",
            },
            "name": "colors.blue.700",
            "originalValue": "#1d4ed8",
            "path": [
              "colors",
              "blue",
              "700",
            ],
            "type": "color",
            "value": "#1d4ed8",
          },
        },
        "detail": "#1d4ed8",
        "kind": 16,
        "label": "blue.700",
        "labelDetails": {
          "description": "#1d4ed8",
          "detail": "   var(--colors-blue-700)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000700",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "800",
                ],
              ],
              "condition": "base",
              "prop": "blue.800",
              "var": "--colors-blue-800",
              "varRef": "var(--colors-blue-800)",
            },
            "name": "colors.blue.800",
            "originalValue": "#1e40af",
            "path": [
              "colors",
              "blue",
              "800",
            ],
            "type": "color",
            "value": "#1e40af",
          },
        },
        "detail": "#1e40af",
        "kind": 16,
        "label": "blue.800",
        "labelDetails": {
          "description": "#1e40af",
          "detail": "   var(--colors-blue-800)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000800",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "900",
                ],
              ],
              "condition": "base",
              "prop": "blue.900",
              "var": "--colors-blue-900",
              "varRef": "var(--colors-blue-900)",
            },
            "name": "colors.blue.900",
            "originalValue": "#1e3a8a",
            "path": [
              "colors",
              "blue",
              "900",
            ],
            "type": "color",
            "value": "#1e3a8a",
          },
        },
        "detail": "#1e3a8a",
        "kind": 16,
        "label": "blue.900",
        "labelDetails": {
          "description": "#1e3a8a",
          "detail": "   var(--colors-blue-900)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000900",
      },
      {
        "data": {
          "propName": "color",
          "shorthand": undefined,
          "token": _Token {
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
                  "950",
                ],
              ],
              "condition": "base",
              "prop": "blue.950",
              "var": "--colors-blue-950",
              "varRef": "var(--colors-blue-950)",
            },
            "name": "colors.blue.950",
            "originalValue": "#172554",
            "path": [
              "colors",
              "blue",
              "950",
            ],
            "type": "color",
            "value": "#172554",
          },
        },
        "detail": "#172554",
        "kind": 16,
        "label": "blue.950",
        "labelDetails": {
          "description": "#172554",
          "detail": "   var(--colors-blue-950)",
        },
        "preselect": false,
        "sortText": "-blue.0000000000950",
      },
    ]
  `)
})

test('width: xl', () => {
  const ctx = createContext()
  expect(getCompletionFor({ ctx, propName: 'width', propValue: 'x', settings: {} })).toMatchInlineSnapshot(`
    [
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": _Token {
            "deprecated": undefined,
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
          },
        },
        "kind": 20,
        "label": "xs",
        "preselect": false,
        "sortText": "-xs",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": undefined,
        },
        "kind": 20,
        "label": "xl",
        "preselect": false,
        "sortText": "-xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": _Token {
            "deprecated": undefined,
            "description": undefined,
            "extensions": {
              "category": "sizes",
              "condition": "base",
              "pixelValue": "672px",
              "prop": "2xl",
              "var": "--sizes-2xl",
              "varRef": "var(--sizes-2xl)",
            },
            "name": "sizes.2xl",
            "originalValue": "42rem",
            "path": [
              "sizes",
              "2xl",
            ],
            "type": undefined,
            "value": "42rem",
          },
        },
        "kind": 20,
        "label": "2xl",
        "preselect": false,
        "sortText": "-0000000000002xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": undefined,
        },
        "kind": 20,
        "label": "3xl",
        "preselect": false,
        "sortText": "-0000000000003xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": _Token {
            "deprecated": undefined,
            "description": undefined,
            "extensions": {
              "category": "sizes",
              "condition": "base",
              "pixelValue": "896px",
              "prop": "4xl",
              "var": "--sizes-4xl",
              "varRef": "var(--sizes-4xl)",
            },
            "name": "sizes.4xl",
            "originalValue": "56rem",
            "path": [
              "sizes",
              "4xl",
            ],
            "type": undefined,
            "value": "56rem",
          },
        },
        "kind": 20,
        "label": "4xl",
        "preselect": false,
        "sortText": "-0000000000004xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": undefined,
        },
        "kind": 20,
        "label": "5xl",
        "preselect": false,
        "sortText": "-0000000000005xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": _Token {
            "deprecated": undefined,
            "description": undefined,
            "extensions": {
              "category": "sizes",
              "condition": "base",
              "pixelValue": "1152px",
              "prop": "6xl",
              "var": "--sizes-6xl",
              "varRef": "var(--sizes-6xl)",
            },
            "name": "sizes.6xl",
            "originalValue": "72rem",
            "path": [
              "sizes",
              "6xl",
            ],
            "type": undefined,
            "value": "72rem",
          },
        },
        "kind": 20,
        "label": "6xl",
        "preselect": false,
        "sortText": "-0000000000006xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": undefined,
        },
        "kind": 20,
        "label": "7xl",
        "preselect": false,
        "sortText": "-0000000000007xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": _Token {
            "deprecated": undefined,
            "description": undefined,
            "extensions": {
              "category": "sizes",
              "condition": "base",
              "pixelValue": "1440px",
              "prop": "8xl",
              "var": "--sizes-8xl",
              "varRef": "var(--sizes-8xl)",
            },
            "name": "sizes.8xl",
            "originalValue": "90rem",
            "path": [
              "sizes",
              "8xl",
            ],
            "type": undefined,
            "value": "90rem",
          },
        },
        "kind": 20,
        "label": "8xl",
        "preselect": false,
        "sortText": "-0000000000008xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": undefined,
        },
        "kind": 20,
        "label": "max",
        "preselect": false,
        "sortText": "-max",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": _Token {
            "deprecated": undefined,
            "description": undefined,
            "extensions": {
              "category": "sizes",
              "condition": "base",
              "pixelValue": "1280px",
              "prop": "breakpoint-xl",
              "var": "--sizes-breakpoint-xl",
              "varRef": "var(--sizes-breakpoint-xl)",
            },
            "name": "sizes.breakpoint-xl",
            "originalValue": "1280px",
            "path": [
              "sizes",
              "breakpoint-xl",
            ],
            "type": undefined,
            "value": "1280px",
          },
        },
        "kind": 20,
        "label": "breakpoint-xl",
        "preselect": false,
        "sortText": "-breakpoint-xl",
      },
      {
        "data": {
          "propName": "width",
          "shorthand": undefined,
          "token": undefined,
        },
        "kind": 20,
        "label": "breakpoint-2xl",
        "preselect": false,
        "sortText": "-breakpoint1000000000002xl",
      },
    ]
  `)
})

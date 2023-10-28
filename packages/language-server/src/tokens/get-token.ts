import { type PandaContext } from '@pandacss/node'
import { type Token } from '@pandacss/token-dictionary'
import { color2kToVsCodeColor } from './color2k-to-vscode-color'
import { expandTokenFn } from './expand-token-fn'
import { isColor } from './is-color'

const getColorExtensions = (value: string, kind: string) => {
  const vscodeColor = color2kToVsCodeColor(value)
  if (!vscodeColor) return

  return { vscodeColor, kind }
}

export const getTokenFromPropValue = (ctx: PandaContext, prop: string, value: string): Token | undefined => {
  const utility = ctx.config.utilities?.[prop]

  const category = typeof utility?.values === 'string' && utility?.values
  if (!category) return

  const tokenPath = [category, value].join('.')
  const token = ctx.tokens.getByName(tokenPath)

  // arbitrary value like
  // display: "block", zIndex: 1, ...
  if (!token) {
    // any color
    // color: "blue", color: "#000", color: "rgb(0, 0, 0)", ...
    if (isColor(value)) {
      const extensions = getColorExtensions(value, 'native-color')
      if (!extensions) return

      return { value, name: value, path: tokenPath, type: 'color', extensions } as unknown as Token
    }

    // border="1px solid token(colors.gray.300)"
    if (typeof value === 'string' && value.includes('token(')) {
      const matches = expandTokenFn(value, ctx.tokens.getByName)

      // wrong token path
      if (!matches.length) {
        return {
          value,
          name: value,
          path: tokenPath,
          type: 'color',
          extensions: { kind: 'invalid-token-path' },
        } as unknown as Token
      }

      // TODO: handle multiple tokens like : "token(colors.gray.300), token(colors.gray.500)"
      const first = matches?.[0]?.token
      if (!first) return

      if (isColor(first.value)) {
        const extensions = getColorExtensions(first.value, 'semantic-color')
        if (!extensions) return

        return first.setExtensions(extensions)
      }

      return first
    }

    return
  }

  // known theme token
  // px: "2", fontSize: "xl", ...
  // color: "blue.300"

  let color = token.value
  // could be a semantic token, so the token.value wouldn't be a color directly, it's actually a CSS variable
  if (!isColor(color) && token.value.startsWith('var(--')) {
    const [tokenRef] = ctx.tokens.getReferences(token.originalValue)
    if (tokenRef?.value) {
      color = tokenRef.value
    }
  }

  // now it could be a color
  if (isColor(color)) {
    const extensions = getColorExtensions(color, 'color')
    if (!extensions) return

    return token.setExtensions(extensions)
  }

  return token
}

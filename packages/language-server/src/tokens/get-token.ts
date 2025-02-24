import { type PandaContext } from '@pandacss/node'
import { type Token } from '@pandacss/token-dictionary'
import { color2kToVsCodeColor } from './color2k-to-vscode-color'
import { isColor } from './is-color'
import { getTokensInString, hasTokenRef } from './expand-token-fn'

const ESCAPE_HATCHED = /^(\[)(.*)(\])$/

const removeEscapeHatch = (value: string) => {
  if (ESCAPE_HATCHED.test(value)) {
    return value.match(ESCAPE_HATCHED)?.[2] as string
  }
  return value
}

const getColorExtensions = (value: string, kind: string) => {
  const vscodeColor = color2kToVsCodeColor(value)
  if (!vscodeColor) return

  return { vscodeColor, kind }
}

export const getTokenFromPropValue = (ctx: PandaContext, prop: string, value: string): Token | undefined => {
  const utility = ctx.config.utilities?.[prop]

  const potentialCategories: string[] = []

  if (typeof utility?.values === 'string' && utility?.values) {
    potentialCategories.push(utility?.values)
  }

  if (typeof utility?.values === 'function' && ctx.config.theme) {
    // Invoke the utility value function and capture categories potentially used by consumer
    utility.values((token: string) => {
      potentialCategories.push(token)
    })
  }

  if (!potentialCategories.length) return

  // Attempt to locate a token
  const matchedToken = potentialCategories
    .map((category) => {
      return [category, value].join('.')
    })
    .map((tokenPath) => {
      return {
        token: ctx.tokens.getByName(tokenPath),
        tokenPath,
      }
    })
    .find((t) => t.token !== undefined)

  const token = matchedToken?.token

  // arbitrary value like
  // display: "block", zIndex: 1, ...
  if (!token) {
    // remove escape hatch if found
    value = removeEscapeHatch(value)
    // Use the first category for the token path
    const tokenPath = [potentialCategories[0], value].join('.')

    // any color
    // color: "blue", color: "#000", color: "rgb(0, 0, 0)", ...
    if (isColor(value)) {
      const extensions = getColorExtensions(value, 'native-color')
      if (!extensions) return

      return { value, name: value, path: tokenPath, type: 'color', extensions } as unknown as Token
    }

    // border="1px solid token(colors.gray.300)"
    if (typeof value === 'string' && hasTokenRef(value)) {
      const matches = getTokensInString(value, (key) => ctx.tokens.getByName(key))

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
      const first = matches?.[0]
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
  if (!isColor(color) && typeof token.value === 'string' && token.value.startsWith('var(--')) {
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

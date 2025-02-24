// https://github.com/chakra-ui/panda/blob/ab32d1d798c353ce4793f01b1e5cae3407bc209e/packages/token-dictionary/src/utils.ts

import { logger } from '@pandacss/logger'
import { esc } from '@pandacss/shared'
import type { Token } from '@pandacss/token-dictionary'

/* -----------------------------------------------------------------------------
 * Token references
 * -----------------------------------------------------------------------------*/

/**
 * Regex for matching a tokenized reference.
 */
const REFERENCE_REGEX = /({([^}]*)})/
const curlyBracketRegex = /[{}]/

/**
 * Returns all references in a string
 *
 * @example
 *
 * `{colors.red.300} {sizes.sm}` => ['colors.red.300', 'sizes.sm']
 */
export function getReferences(value: string) {
  if (typeof value !== 'string') return []
  const matches = value.match(REFERENCE_REGEX)
  if (!matches) return []
  return matches.map((match) => match.replace(curlyBracketRegex, '')).map((value) => value.trim())
}

export const hasCurlyReference = (value: string) => REFERENCE_REGEX.test(value)
export const hasTokenFnReference = (str: string) => str.includes('token(')

export const hasTokenRef = (v: string) => hasCurlyReference(v) || hasTokenFnReference(v)
const tokenFunctionRegex = /token\(([^)]+)\)/g
const closingParenthesisRegex = /\)$/g

const tokenReplacer = (a: string, b?: string) =>
  b ? (a.endsWith(')') ? a.replace(closingParenthesisRegex, `, ${b})`) : `var(${a}, ${b})`) : a

const notFoundMessage = (key: string, value: string) => `Reference not found: \`${key}\` in "${value}"`

export function getTokensInString(value: string, fn: (key: string) => Token | undefined) {
  if (!hasTokenRef(value)) return []

  const references = getReferences(value)

  const expanded = references.reduce((valueStr, key) => {
    const resolved = fn(key)
    if (!resolved) {
      logger.warn('token', notFoundMessage(key, value))
    }
    const expandedValue = resolved?.value ?? esc(key)

    return valueStr.replace(`{${key}}`, expandedValue)
  }, value)

  if (!hasTokenFnReference(expanded)) return references.map((key) => fn(key)).filter(Boolean)

  const _rawValue = expanded.replace(tokenFunctionRegex, (_, token) => {
    const [tokenValue, tokenFallback] = token.split(',').map((s: string) => s.trim())

    const result = [tokenValue, tokenFallback].filter(Boolean).map((key) => {
      const resolved = fn(key)

      if (!resolved && hasTokenRef(key)) {
        logger.warn('token', notFoundMessage(key, value))
      }

      if (resolved) {
        references.push(key)
      }

      return resolved?.value ?? esc(key)
    })

    if (result.length > 1) {
      const [a, b] = result
      return tokenReplacer(a!, b)
    }

    return tokenReplacer(result[0]!)
  })

  return references.map((key) => fn(key)).filter(Boolean)
}

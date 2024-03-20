// https://github.com/chakra-ui/panda/blob/ab32d1d798c353ce4793f01b1e5cae3407bc209e/packages/token-dictionary/src/utils.ts

import type { Token } from '@pandacss/token-dictionary'

/* -----------------------------------------------------------------------------
 * Token references
 * -----------------------------------------------------------------------------*/

/**
 * Regex for matching a tokenized reference.
 */
const REFERENCE_REGEX = /({([^}]*)})/g
const curlyBracketRegex = /[{}]/g

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

export const hasReference = (value: string) => REFERENCE_REGEX.test(value)
export const hasTokenReference = (str: string) => str.includes('token(')

const isTokenReference = (v: string) => hasReference(v) || hasTokenReference(v)

export function expandReferences(value: string, fn: (key: string) => Token | undefined) {
  if (!isTokenReference(value)) return []

  const references = getReferences(value)
  return references.map((key) => fn(key)).filter(Boolean)
}

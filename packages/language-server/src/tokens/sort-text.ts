// Detect specific scale tokens
const specificTokenPattern = /^\$(color|radius|size|space|zIndex)\.(.+)$/

/**
 * Reformats a token string to be used for sorting
 *
 * - Specific tokens are sorted last
 * - Numeric portions of tokens are sorted numerically
 */
export const getSortText = (sortText: string) => {
  let text = sortText
  // add prefix to specific tokens to sort them last:
  text = text.replace(specificTokenPattern, '$zzzzzzzzzz$1.$2')
  // add prefix to numeric portions of tokens to sort them numerically:
  text = text.replace(/(-?)(\d+)/g, (_, sign, num) => {
    return `${sign ? '1' : '0'}${num.padStart(12, '0')}`
  })
  // special case for negative text tokens like $-true
  text = text.replace(/(^\$|\.)-(\w.+)$/, '$1z$2')
  return text
}

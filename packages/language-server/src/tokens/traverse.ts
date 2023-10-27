type CallbackFn = (args: CallbackItem) => void
type CallbackItem = { value: any; path: string; depth: number; parent: any[] | Record<string, unknown>; key: string }

export const isObjectOrArray = (obj: unknown) => typeof obj === 'object' && obj !== null
const defaultOptions = { separator: '.', maxDepth: Infinity }

export function traverse(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  const stack: CallbackItem[] = [{ value: obj, path: '', depth: -1, parent: null as any, key: '' }]

  while (stack.length > 0) {
    const currentItem = stack.pop()!

    // Call the callback function
    if (currentItem.parent !== null) {
      callback(currentItem)
    }

    // If the value is an object or array and depth is within limits, push its properties to the stack
    if (isObjectOrArray(currentItem.value) && currentItem.depth < maxDepth) {
      const keys = Object.keys(currentItem.value)
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i] as string
        const value = currentItem.value[key]
        const path = currentItem.path ? currentItem.path + separator + key : key
        stack.push({ value, path, depth: currentItem.depth + 1, parent: currentItem.value, key })
      }
    }
  }
}

type Dict = Record<string, any>

export const setValueIn = (obj: Dict, path: string[], value: Record<string, unknown>) => {
  if (!path.length) return Object.assign(obj, value) as Dict

  let current = obj as Record<string, any>
  for (let i = 0; i < path.length; i++) {
    const key = path[i] as string
    if (!current[key]) {
      current[key] = {}
    }

    if (i === path.length - 1) {
      Object.assign(current[key], value)
    } else {
      current = current[key]
    }
  }

  return obj
}

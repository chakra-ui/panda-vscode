import { type SystemStyleObject } from '@pandacss/types'
import { Identifier, Node } from 'ts-morph'

import {
  BoxNodeArray,
  BoxNodeLiteral,
  BoxNodeMap,
  BoxNodeObject,
  box,
  findIdentifierValueDeclaration,
  type BoxContext,
} from '@pandacss/extractor'
import { Bool } from 'lil-fp'

export type BoxNodeWithValue = BoxNodeObject | BoxNodeLiteral | BoxNodeMap | BoxNodeArray
export type ExtractableFnName = (typeof extractableFns)[number]

const extractableFns = ['css', 'cx'] as const
const canEvalFn = (name: string): name is ExtractableFnName => extractableFns.includes(name as any)

const mergeCx = (...args: any[]) =>
  args.filter(Boolean).reduce((acc, curr) => {
    if (typeof curr === 'object') return Object.assign(acc, curr)

    return acc
  }, {})

const isFunctionMadeFromDefineParts = (expr: Identifier) => {
  const declaration = findIdentifierValueDeclaration(expr, [], boxCtx)
  if (!Node.isVariableDeclaration(declaration)) return

  const initializer = declaration.getInitializer()
  if (!Node.isCallExpression(initializer)) return

  const fromFunctionName = initializer.getExpression().getText()
  return fromFunctionName === 'defineParts'
}

const boxCtx: BoxContext = {
  flags: { skipTraverseFiles: true },
  getEvaluateOptions: (node) => {
    if (!Node.isCallExpression(node)) return
    const expr = node.getExpression()

    if (!Node.isIdentifier(expr)) return
    const name = expr.getText()

    // TODO - check for import alias ? kinda overkill for now
    if (!canEvalFn(name as string) && !isFunctionMadeFromDefineParts(expr)) {
      return
    }

    return {
      environment: {
        extra: {
          cx: mergeCx,
          css: (styles: SystemStyleObject) => styles,
        },
      },
    } as any
  },
}

const isNodeJsx = Bool.or(Node.isJsxSelfClosingElement, Node.isJsxOpeningElement)
const getNestedBoxProp = (map: BoxNodeMap, path: string[]) => {
  return path.reduce((acc, curr) => {
    if (box.isMap(acc)) return acc.value.get(curr)
    if (box.isObject(acc)) return acc.value[curr]

    return acc
  }, map as any)
}

export const extractor = {
  canEvalFn,
  mergeCx,
  boxCtx,
  isNodeJsx,
  getNestedBoxProp,
}

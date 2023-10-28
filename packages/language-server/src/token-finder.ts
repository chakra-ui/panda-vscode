import { Position, Range } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

import { type Dict, type ParserResultType, type RawCondition } from '@pandacss/types'
import { CallExpression, JsxOpeningElement, JsxSelfClosingElement, Node } from 'ts-morph'

import {
  BoxNodeMap,
  BoxNodeObject,
  box,
  extractCallExpressionArguments,
  extractJsxAttribute,
  extractJsxElementProps,
  maybeBoxNode,
  unbox,
  type PrimitiveType,
  type Unboxed,
} from '@pandacss/extractor'
import { type Token } from '@pandacss/token-dictionary'
import { match } from 'ts-pattern'
import { type BoxNodeWithValue, type ExtractableFnName, extractor } from './extractor'
import type { GetContext } from './panda-language-server'
import type { ProjectHelper } from './project-helper'
import { getTokenFromPropValue } from './tokens/get-token'
import { isObjectLike, nodeRangeToVsCodeRange } from './tokens/utils'

export class TokenFinder {
  constructor(private getContext: GetContext, private project: ProjectHelper) {}

  /**
   * Get all the tokens from the document and call a callback on it.
   */
  getFileTokens(_doc: TextDocument, parserResult: ParserResultType, onToken: OnTokenCallback) {
    const ctx = this.getContext()
    if (!ctx) return

    this.project.getFileTokens(_doc, parserResult, ({ propName, propValue, shorthand, propNode }) => {
      const token = getTokenFromPropValue(ctx, propName, String(propValue))
      if (!token) return

      const range = nodeRangeToVsCodeRange(propNode.getRange())
      onToken?.({ kind: 'token', token, range, propName, propValue, propNode, shorthand })
    })
  }

  findClosestInstance<Return>(node: Node, stack: Node[], onFoundInstance: (args: ClosestInstance) => Return) {
    const ctx = this.getContext()
    if (!ctx) return

    let current: Node | undefined = node

    return match(node)
      .when(
        () => {
          const callExpression = getFirstAncestorMatching(stack, (node): node is CallExpression => {
            if (!Node.isCallExpression(node)) return false
            const expr = node.getExpression()

            // TODO - check for import alias ? kinda overkill for now
            if (Node.isIdentifier(expr) && !extractor.canEvalFn(expr.getText())) return false

            return true
          })
          if (!callExpression) return

          current = callExpression
          return current
        },
        () => {
          const callExpression = current as CallExpression
          const name = callExpression.getExpression().getText() as ExtractableFnName

          if (name === 'cx') {
            const list = extractCallExpressionArguments(
              callExpression,
              extractor.boxCtx,
              () => true,
              () => true,
            )
            const styles = extractor.mergeCx(
              ...list.value
                .filter((node) => isObjectLike(node))
                .map((item) => (item as BoxNodeMap | BoxNodeObject).value),
            )

            return onFoundInstance({
              kind: 'styles',
              name,
              props: box.object(styles, callExpression, stack),
            })
          }

          const list = extractCallExpressionArguments(
            callExpression,
            extractor.boxCtx,
            () => true,
            (args) => args.index === 0,
          )
          const config = list.value[0]
          if (!isObjectLike(config)) return

          if (name === 'css' || name === 'defineStyles') {
            return onFoundInstance({ kind: 'styles', name, props: config })
          }
        },
      )
      .when(
        () => {
          current = getFirstAncestorMatching(stack, extractor.isNodeJsx)
          return current
        },
        () => {
          const componentNode = current as JsxSelfClosingElement | JsxOpeningElement
          const { name, props } = extractJsxElementProps(componentNode, extractor.boxCtx)
          if (!props.size) return

          return onFoundInstance({ kind: 'styles', name, props: box.map(props, componentNode, stack) })
        },
      )
      .otherwise(() => {
        //
        return undefined
      })
  }

  findClosestToken<Return>(
    node: Node,
    stack: Node[],
    onFoundToken: (args: Pick<ClosestToken, 'propName' | 'propNode' | 'shorthand'>) => Return,
  ) {
    const ctx = this.getContext()
    if (!ctx) return

    return match(node)
      .when(
        () => getFirstAncestorMatching(stack, Node.isPropertyAssignment),
        () => {
          const propAssignment = getFirstAncestorMatching(stack, Node.isPropertyAssignment)!
          const name = propAssignment.getName()

          const objectLiteral = getFirstAncestorMatching(stack, Node.isObjectLiteralExpression)!
          const maybeBox = maybeBoxNode(objectLiteral, [], extractor.boxCtx, (args) => args.propName === name)
          if (!box.isMap(maybeBox)) return

          const propNode = maybeBox.value.get(name)
          if (!box.hasValue(propNode)) return

          const propName = ctx.utility.resolveShorthand(name)

          return onFoundToken({ propName, propNode, shorthand: name })
        },
      )
      .when(
        () => getFirstAncestorMatching(stack, Node.isJsxAttribute),
        () => {
          const attrNode = getFirstAncestorMatching(stack, Node.isJsxAttribute)!

          const nameNode = attrNode.getNameNode()
          const name = nameNode.getText()

          const attrBox = extractJsxAttribute(attrNode, extractor.boxCtx)
          if (!box.hasValue(attrBox)) return

          const propName = ctx.utility.resolveShorthand(name)

          return onFoundToken({ propName, propNode: attrBox, shorthand: name })
        },
      )
      .otherwise(() => {
        //
        return undefined
      })
  }

  getClosestToken(doc: TextDocument, position: Position): ClosestToken | undefined {
    const ctx = this.getContext()
    if (!ctx) return

    const match = this.project.getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match

    return this.findClosestToken(node, stack, ({ propName, propNode }) => {
      if (box.isLiteral(propNode)) {
        const propValue = propNode.value
        const maybeToken = getTokenFromPropValue(ctx, propName, String(propValue))
        if (!maybeToken) return

        const range = nodeRangeToVsCodeRange(propNode.getRange())
        return { kind: 'token', token: maybeToken, range, propName, propValue, propNode } as ClosestTokenMatch
      }

      if (box.isMap(propNode) && ctx.conditions.isCondition(propName)) {
        const objectBox = maybeBoxNode(propNode.getNode(), [], extractor.boxCtx, () => true)
        if (!objectBox) return

        if (box.isMap(objectBox)) {
          const propValue = unbox(propNode).raw
          const condition = ctx.conditions.getRaw(propName)

          const range = nodeRangeToVsCodeRange(propNode.getRange())
          return { kind: 'condition', condition, range, propName, propValue, propNode } as ClosestConditionMatch
        }
      }
    })
  }

  getClosestInstance(doc: TextDocument, position: Position) {
    const ctx = this.getContext()
    if (!ctx) return

    const match = this.project.getNodeAtPosition(doc, position)
    if (!match) return

    const { node, stack } = match

    return this.findClosestInstance(node, stack, (instance) => {
      if (instance.kind === 'styles') {
        const { name, props } = instance

        const unboxed = unbox(props)
        const { className, css, ...rest } = unboxed.raw
        return {
          kind: 'styles',
          name,
          props,
          styles: Object.assign({}, className, css, rest),
        } as ClosestStylesInstance & { styles: Dict }
      }
    })
  }
}

type ClosestMatch = {
  range: Range
  propName: string
  propNode: BoxNodeWithValue
}
type ClosestTokenMatch = ClosestMatch & {
  kind: 'token'
  token: Token
  propValue: PrimitiveType
  shorthand: string
}

type ClosestConditionMatch = ClosestMatch & {
  kind: 'condition'
  condition: RawCondition
  propValue: Unboxed['raw']
  shorthand: never
}
type ClosestToken = ClosestTokenMatch | ClosestConditionMatch

type ClosestInstanceMatch = { name: string }
type ClosestStylesInstance = { kind: 'styles'; props: BoxNodeMap | BoxNodeObject }
type ClosestInstance = ClosestInstanceMatch & ClosestStylesInstance

type OnTokenCallback = (args: ClosestToken) => void

// quick index based loop
const getFirstAncestorMatching = <Ancestor extends Node>(
  stack: Node[],
  callback: (parent: Node, index: number) => parent is Ancestor,
) => {
  for (let i = stack.length - 1; i >= 0; i--) {
    const parent = stack[i]
    if (parent && callback(parent, i)) return parent
  }
}

import { Position } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

import { type ParserResultType, type ResultItem } from '@pandacss/types'
import { Node, SourceFile, ts } from 'ts-morph'

import { box, type PrimitiveType } from '@pandacss/extractor'
import { type PandaContext } from '@pandacss/node'
import { type ParserResult } from '@pandacss/parser'
import { walkObject } from '@pandacss/shared'
import { extractor, type BoxNodeWithValue } from './extractor'

interface RawToken {
  propName: string
  propValue: PrimitiveType
  propNode: BoxNodeWithValue
  shorthand: string
}

export class ProjectHelper {
  constructor(private getContext: () => PandaContext | undefined) {}

  getSourceFile(doc: TextDocument) {
    const ctx = this.getContext()
    if (!ctx) return

    return ctx.project.getSourceFile(doc.uri) as SourceFile | undefined
  }

  /**
   * Get the local component list of local tokens.
   */
  parseSourceFile(doc: TextDocument) {
    const ctx = this.getContext()
    if (!ctx) return

    const project = ctx.project

    project.addSourceFile(doc.uri, doc.getText())
    return project.parseSourceFile(doc.uri) as ParserResult
  }

  getNodeAtPosition = (doc: TextDocument, position: Position) => {
    const ctx = this.getContext()
    if (!ctx) return

    const sourceFile = this.getSourceFile(doc)
    if (!sourceFile) return

    const charIndex = ts.getPositionOfLineAndCharacter(sourceFile.compilerNode, position.line, position.character)
    return getDescendantAtPos(sourceFile, charIndex)
  }

  /**
   * Get all the tokens from the document and call a callback on it.
   */
  getFileTokens(_doc: TextDocument, parserResult: ParserResultType, onRawToken: (token: RawToken) => void) {
    const ctx = this.getContext()
    if (!ctx) return

    const onResult = (result: ResultItem) => {
      const boxNode = result.box
      if (box.isLiteral(boxNode)) return

      result.data.forEach((styles) => {
        const keys = Object.keys(styles)
        if (!keys.length) return

        walkObject(styles, (value, paths) => {
          // if value doesn't exist
          if (value == null) return

          const [prop, ..._allConditions] = ctx.conditions.shift(paths)
          const propNode = box.isArray(boxNode)
            ? boxNode.value.find((node) => box.isMap(node) && extractor.getNestedBoxProp(node, paths))
            : extractor.getNestedBoxProp(boxNode, paths)
          if (!box.isLiteral(propNode) || !prop) return

          const propName = ctx.utility.resolveShorthand(prop)
          onRawToken({ propName, propValue: value, propNode, shorthand: prop })
        })
      })
    }

    parserResult.css.forEach(onResult)
    parserResult.jsx.forEach(onResult)
    parserResult.cva.forEach((item) => {
      const map = item.box
      if (!box.isMap(map)) return
      return item.data.forEach(({ base }) =>
        onResult(Object.assign({}, item, { box: map.value.get('base'), data: [base] })),
      )
    })
    parserResult.sva.forEach((item) => {
      const map = item.box
      if (!box.isMap(map)) return
      return item.data.forEach(({ base }) =>
        onResult(Object.assign({}, item, { box: map.value.get('base'), data: [base] })),
      )
    })
    parserResult.pattern.forEach((set, name) => {
      set.forEach((item) => {
        const map = item.box
        if (!box.isMap(map)) return
        return item.data.forEach((obj) => {
          onResult({ box: map, data: [obj], name, type: 'pattern' })
        })
      })
    })
  }
}

const getDescendantAtPos = (from: Node, pos: number) => {
  let node: Node | undefined = from
  const stack: Node[] = [from]

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const nextNode: Node | undefined = node.getChildAtPos(pos)
    if (nextNode == null) return { node, stack }
    else {
      node = nextNode
      stack.push(node)
    }
  }
}

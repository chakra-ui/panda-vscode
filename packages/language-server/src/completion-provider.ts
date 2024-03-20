import { CompletionItem, CompletionItemKind, Position } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

import { type PandaVSCodeSettings } from '@pandacss/extension-shared'
import { BoxNodeLiteral, box } from '@pandacss/extractor'
import { type PandaContext } from '@pandacss/node'
import { type Token } from '@pandacss/token-dictionary'
import { extractTokenPaths } from './tokens/expand-token-fn'
import { makeColorTile, makeTable } from './tokens/render-markdown'
import { getSortText } from './tokens/sort-text'
import { traverse } from './tokens/traverse'
import { getMarkdownCss, printTokenValue } from './tokens/utils'
import type { GetContext } from './panda-language-server'
import type { ProjectHelper } from './project-helper'
import type { TokenFinder } from './token-finder'

export class CompletionProvider {
  constructor(
    private getContext: GetContext,
    private getPandaSettings: () => Promise<PandaVSCodeSettings>,
    private project: ProjectHelper,
    private tokenFinder: TokenFinder,
  ) {}

  async getClosestCompletionList(doc: TextDocument, position: Position) {
    const ctx = this.getContext()
    if (!ctx) return

    const match = this.project.getNodeAtPosition(doc, position)
    if (!match) return

    const settings = await this.getPandaSettings()
    const { node, stack } = match

    try {
      return await this.tokenFinder.findClosestToken(node, stack, ({ propName, propNode, shorthand }) => {
        if (!box.isLiteral(propNode)) return undefined
        return getCompletionFor({ ctx, propName, propNode, settings, shorthand })
      })
    } catch (err) {
      console.error(err)
      console.trace()
      return
    }
  }

  async getCompletionDetails(item: CompletionItem) {
    const ctx = this.getContext()
    if (!ctx) return

    const settings = await this.getPandaSettings()
    const { propName, token, shorthand } = (item.data ?? {}) as { propName: string; token?: Token; shorthand: string }
    if (!token) return
    const markdownCss = await getMarkdownCss(ctx, { [propName]: token.value }, settings)

    const markdown = [markdownCss.withCss]
    if (shorthand !== propName) {
      markdown.push(`\`${shorthand}\` is shorthand for \`${propName}\``)
    }

    const conditions = token.extensions.conditions ?? { base: token.value }
    if (conditions) {
      const separator = '[___]'
      const table = [{ color: ' ', theme: 'Condition', value: 'Value' }]

      const tab = '&nbsp;&nbsp;&nbsp;&nbsp;'
      traverse(
        conditions,
        ({ key: cond, value, depth }) => {
          if (!ctx.conditions.get(cond) && cond !== 'base') return

          const indent = depth > 0 ? tab.repeat(depth) + '├ ' : ''

          if (typeof value === 'object') {
            table.push({
              color: '',
              theme: `${indent}**${cond}**`,
              value: '─────',
            })
            return
          }

          const [tokenRef] = ctx.tokens.getReferences(value)
          const color = tokenRef?.value ?? value
          if (!color) return

          table.push({
            color: makeColorTile(color),
            theme: `${indent}**${cond}**`,
            value: `\`${color}\``,
          })
        },
        { separator },
      )

      markdown.push(makeTable(table))
      markdown.push(`\n${tab}`)
    }

    item.documentation = { kind: 'markdown', value: markdown.join('\n') }
  }
}

const getCompletionFor = ({
  ctx,
  propName,
  shorthand,
  propNode,
  settings,
}: {
  ctx: PandaContext
  propName: string
  shorthand?: string
  propNode: BoxNodeLiteral
  settings: PandaVSCodeSettings
}) => {
  const propValue = propNode.value

  let str = String(propValue)
  let category: string | undefined

  // also provide completion in string such as: token('colors.blue.300')
  if (settings['completions.token-fn.enabled'] && str.includes('token(')) {
    const matches = extractTokenPaths(str)
    const tokenPath = matches[0] ?? ''
    const split = tokenPath.split('.').filter(Boolean)

    // provide completion for token category when token() is empty or partial
    if (split.length < 1) {
      return Array.from(ctx.tokens.view.categoryMap.keys()).map((category) => {
        return {
          label: category,
          kind: CompletionItemKind.EnumMember,
          sortText: '-' + category,
          preselect: true,
        } as CompletionItem
      })
    }

    str = tokenPath.split('.').slice(1).join('.')
    category = split[0]
  }

  // token(colors.red.300) -> category = "colors"
  // color="red.300" -> no category, need to find it
  let propValues: Record<string, string> | undefined
  if (!category) {
    const utility = ctx.config.utilities?.[propName]
    if (!utility?.values) return

    // values: "spacing"
    if (typeof utility?.values === 'string') {
      category = utility.values
    } else if (typeof utility.values === 'function') {
      // values: (theme) => { ...theme("spacing") }
      const record = ctx.utility.getPropertyValues(utility, (cat) => {
        category = cat
        return cat
      })
      if (record) {
        if (record.type) category = record.type as string
        else propValues = record as Record<string, string>
      }
    }
  }

  // values: { "1": "1px", "2": "2px", ... }
  if (propValues) {
    const items = [] as CompletionItem[]
    Object.entries(propValues).map(([name, value]) => {
      // margin: "2" -> ['var(--spacing-2)', 'var(--spacing-12)', 'var(--spacing-20)', ...]
      if (str && !name.includes(str)) return

      const tokenPath = matchVar(value ?? '')?.replace('-', '.')
      const token = tokenPath && ctx.tokens.getByName(tokenPath)

      items.push({
        data: { propName, token, shorthand },
        label: name,
        kind: CompletionItemKind.EnumMember,
        sortText: '-' + getSortText(name),
        preselect: false,
      })
    })

    return items
  }

  if (!category) return []

  const categoryValues = ctx.tokens.view.categoryMap.get(category as any)
  if (!categoryValues) return []

  const items = [] as CompletionItem[]
  categoryValues.forEach((token, name) => {
    if (str && !name.includes(str)) return

    const isColor = token.extensions.category === 'colors'

    const completionItem = {
      data: { propName, token, shorthand },
      label: name,
      kind: isColor ? CompletionItemKind.Color : CompletionItemKind.EnumMember,
      labelDetails: { description: printTokenValue(token, settings), detail: `   ${token.extensions.varRef}` },
      sortText: '-' + getSortText(name),
      preselect: false,
    } as CompletionItem

    if (isColor) {
      completionItem.detail = token.value
      // TODO rgb conversion ?
    }

    items.push(completionItem)
  })

  return items
}
const cssVarRegex = /var\(--([\w-.]+)\)/g
const matchVar = (str: string) => {
  const match = cssVarRegex.exec(str)
  return match ? match[1] : null
}

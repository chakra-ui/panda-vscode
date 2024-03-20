import { box, type NodeRange } from '@pandacss/extractor'
import { Bool } from 'lil-fp'
import { Range } from 'vscode-languageserver'

import { type SystemStyleObject } from '@pandacss/types'

import { RuleProcessor } from '@pandacss/core'
import { type PandaContext } from '@pandacss/node'
import { toPx } from '@pandacss/shared'
import * as base64 from 'base-64'

import prettierPluginBabel from 'prettier/plugins/babel'
import prettierPluginHtml from 'prettier/plugins/html'
import prettierPluginPostcss from 'prettier/plugins/postcss'
import prettier from 'prettier'
import { match } from 'ts-pattern'
import * as utf8 from 'utf8'

import { type PandaVSCodeSettings } from '@pandacss/extension-shared'
import { type Token } from '@pandacss/token-dictionary'

export const isObjectLike = Bool.or(box.isObject, box.isMap)

export const nodeRangeToVsCodeRange = (range: NodeRange) =>
  Range.create(
    { line: range.startLineNumber - 1, character: range.startColumn - 1 },
    { line: range.endLineNumber - 1, character: range.endColumn - 1 },
  )

function getPrettiedCSS(css: string) {
  return prettier.format(css, {
    parser: 'css',
    plugins: [prettierPluginHtml, prettierPluginBabel, prettierPluginPostcss],
  })
}

export type DisplayOptions = {
  mode?: PandaVSCodeSettings['hovers.display.mode']
  forceHash?: PandaVSCodeSettings['hovers.display.force-hash']
}

export const getMarkdownCss = async (ctx: PandaContext, styles: SystemStyleObject, settings: PandaVSCodeSettings) => {
  const mode = settings['hovers.display.mode']
  const forceHash = settings['hovers.display.force-hash']

  const hash = ctx.config.hash
  if (forceHash) {
    ctx.config.hash = true
  }

  const processor = new RuleProcessor(ctx)
  processor.clone()
  processor.css({ styles })

  const css = match(mode ?? 'optimized')
    .with('nested', () => processor.toCss({ optimize: false }))
    .with('optimized', () => processor.toCss({ optimize: true }))
    .with('minified', () => processor.toCss({ optimize: true, minify: true }))
    .run()

  const raw = await getPrettiedCSS(css)
  const withCss = '```css' + '\n' + raw + '\n' + '```'

  // restore hash
  ctx.config.hash = hash

  return { raw, withCss }
}

export const printTokenValue = (token: Token, settings: PandaVSCodeSettings) =>
  `${token.value}${settings['rem-to-px.enabled'] && token.value.endsWith('rem') ? ` (${toPx(token.value)})` : ''}`

export const svgToMarkdownLink = (svg: string) => {
  const dataUri = 'data:image/svg+xml;charset=UTF-8;base64,' + base64.encode(utf8.encode(svg))
  return `![](${dataUri})`
}

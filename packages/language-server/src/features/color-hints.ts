import { ColorInformation } from 'vscode-languageserver'
import { color2kToVsCodeColor } from '../tokens/color2k-to-vscode-color'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'
import type { PandaLanguageServer } from '../panda-language-server'

export function registerColorHints(lsp: PandaLanguageServer) {
  lsp.log('🐼 Registering color hints')
  lsp.connection.onDocumentColor(
    tryCatch(async (params) => {
      const settings = await lsp.getPandaSettings()
      if (!settings['color-hints.enabled']) return

      await lsp.isReady('🐼 onDocumentColor')

      const doc = lsp.documents.get(params.textDocument.uri)
      if (!doc) {
        return []
      }

      const ctx = lsp.getContext()
      if (!ctx) return []

      const parserResult = lsp.project.parseSourceFile(doc)
      if (!parserResult) {
        return []
      }

      const colors: ColorInformation[] = []

      lsp.tokenFinder.getFileTokens(parserResult, (match) => {
        const isColor = match.kind === 'token' && match.token.extensions?.vscodeColor
        if (!isColor) return

        // Add 1 color hint for each root condition
        if (match.token.extensions.conditions) {
          if (settings['color-hints.semantic-tokens.enabled']) {
            Object.entries(match.token.extensions.conditions).forEach(([cond, value]) => {
              if (!ctx.conditions.get(cond) && cond !== 'base') return
              const [tokenRef] = ctx.tokens.getReferences(value)
              if (!tokenRef) return

              const color = color2kToVsCodeColor(tokenRef.value)
              if (!color) return

              colors.push({ color, range: match.range as any })
            })
          }

          return
        }

        colors.push({
          color: match.token.extensions.vscodeColor,
          range: match.range as any,
        })
      })

      return colors
    }, onError),
  )

  lsp.connection.onColorPresentation(() => {
    return []
  })
}

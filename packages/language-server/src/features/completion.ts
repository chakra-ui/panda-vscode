import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'
import type { PandaLanguageServer } from '../panda-language-server'

export function registerCompletion(lsp: PandaLanguageServer) {
  lsp.log('🐼 Registering completion')
  // This handler provides the initial list of the completion items.
  lsp.connection.onCompletion(
    tryCatch(async (params) => {
      const isEnabled = await lsp.getPandaSettings('completions.enabled')
      if (!isEnabled) return

      await lsp.isReady('✅ onCompletion')

      const doc = lsp.documents.get(params.textDocument.uri)
      if (!doc) {
        return
      }

      // TODO recipe
      const matches = await lsp.completions.getClosestCompletionList(doc, params.position)
      if (!matches?.length) {
        return
      }

      return matches
    }, onError),
  )

  // This handler resolves additional information for the item selected in the completion list.
  lsp.connection.onCompletionResolve(async (item) => {
    await lsp.completions.getCompletionDetails(item)
    return item
  })
}

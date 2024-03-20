import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { tryCatch } from 'lil-fp/func'
import { onError } from '../tokens/error'
import type { PandaLanguageServer } from '../panda-language-server'

export function registerDiagnostics(lsp: PandaLanguageServer) {
  lsp.log('🐼 Registering diagnostics')
  const updateDocumentDiagnostics = tryCatch(async function (doc: TextDocument) {
    const settings = await lsp.getPandaSettings()

    if (!settings['diagnostics.enabled']) {
      // this allows us to clear diagnostics
      return lsp.connection.sendDiagnostics({
        uri: doc.uri,
        version: doc.version,
        diagnostics: [],
      })
    }

    lsp.log(`Update diagnostics for ${doc.uri}`)

    const diagnostics: Diagnostic[] = []
    const parserResult = lsp.project.parseSourceFile(doc)

    if (!parserResult) {
      // this allows us to clear diagnostics
      return lsp.connection.sendDiagnostics({
        uri: doc.uri,
        version: doc.version,
        diagnostics: [],
      })
    }

    lsp.tokenFinder.getFileTokens(parserResult, (match) => {
      if (
        match.kind === 'token' &&
        match.token.extensions.kind === 'invalid-token-path' &&
        settings['diagnostics.invalid-token-path']
      ) {
        diagnostics.push({
          message: `🐼 Invalid token path`,
          range: match.range,
          severity: DiagnosticSeverity.Error,
          code: match.token.name,
        })
      }
    })

    lsp.connection.sendDiagnostics({
      uri: doc.uri,
      version: doc.version,
      diagnostics,
    })
  }, onError)

  return updateDocumentDiagnostics
}

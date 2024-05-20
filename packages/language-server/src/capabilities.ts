import { type ServerCapabilities, TextDocumentSyncKind } from 'vscode-languageserver'

const TRIGGER_CHARACTERS = [
  // class attributes
  '"',
  "'",
  '`',
  // token fn in strings
  '(',
  // token fn paths
  '.',
  // curly token reference in string
  '{',
]

export const getDefaultCapabilities = (): ServerCapabilities => ({
  textDocumentSync: TextDocumentSyncKind.Incremental,
  inlayHintProvider: {
    resolveProvider: false,
  },
  workspace: {
    workspaceFolders: {
      supported: true,
      changeNotifications: true,
    },
  },

  completionProvider: {
    resolveProvider: true,
    // triggerCharacters: ['.', ':', '<', '"', "'", '/', '@', '*'],
    triggerCharacters: TRIGGER_CHARACTERS,

    completionItem: {
      labelDetailsSupport: true,
    },
  },
  definitionProvider: false,
  hoverProvider: true,
  colorProvider: true,
  inlineValueProvider: true,
})

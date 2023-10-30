import * as vscode from 'vscode'
import { LanguageClient } from 'vscode-languageclient/node'
import { PandaExtension } from './panda-extension'

const debug = false
let client: LanguageClient | undefined

export async function activate(context: vscode.ExtensionContext) {
  debug && console.log('activate')

  const extension = new PandaExtension(context, debug)
  await extension.connectToTsPlugin()
  await extension.start()
  client = extension.client

  debug && console.log('activation successful !')
}

export function deactivate(): Thenable<void> | undefined {
  debug && console.log('deactivate')

  if (!client) {
    return undefined
  }

  debug && console.log('stoppping...')
  return client.stop()
}

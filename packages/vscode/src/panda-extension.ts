import * as vscode from 'vscode'
import {
  LanguageClient,
  type LanguageClientOptions,
  type MessageSignature,
  type ServerOptions,
  TransportKind,
  type ColorProviderMiddleware,
} from 'vscode-languageclient/node'
import { join } from 'pathe'
import { defaultSettings, getFlattenedSettings } from '@pandacss/extension-shared'
import { getTsApi, type TsLanguageFeaturesApiV0 } from './typescript-language-features'

// Client entrypoint
const docSelector: vscode.DocumentSelector = [
  'typescript',
  'typescriptreact',
  'javascript',
  'javascriptreact',
  'astro',
  // TODO re-enable whenever we figured out how to map transformed file AST nodes to their original positions
  // 'svelte',
  // 'vue',
]

const getFreshPandaSettings = () => {
  return getFlattenedSettings((vscode.workspace.getConfiguration('panda') as any) ?? defaultSettings)
}

const getActiveDoc = () => vscode.window.activeTextEditor?.document
const getActiveDocFilepath = () => getActiveDoc()?.uri.fsPath

export class PandaExtension {
  client: LanguageClient
  statusBarItem: vscode.StatusBarItem
  tsApi: TsLanguageFeaturesApiV0 | undefined
  colorDecorationType: vscode.TextEditorDecorationType | undefined

  constructor(private context: vscode.ExtensionContext, private debug: boolean) {
    this.log('new PandaExtension')

    this.statusBarItem = this.createStatusBarItem()
    this.client = this.createLanguageClient()

    this.registerSubscriptions()
    this.registerCommands()
  }

  private log(...args: any[]) {
    this.debug && console.log(...args)
  }

  private createLanguageClient() {
    // The server is implemented in node
    const serverModule = this.context.asAbsolutePath(join('dist', 'server.js'))

    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
    const debugOptions = this.debug ? { execArgv: ['--nolazy', '--inspect=6099'] } : {}

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: {
        module: serverModule,
        transport: TransportKind.ipc,
        options: debugOptions,
      },
    }

    const activeDocument = vscode.window.activeTextEditor?.document

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
      documentSelector: docSelector as string[],
      diagnosticCollectionName: 'panda',
      synchronize: {
        fileEvents: [vscode.workspace.createFileSystemWatcher('**/*/panda.config.{ts,js,cjs,mjs}')],
      },
      initializationOptions: () => {
        return {
          activeDocumentFilepath: activeDocument?.uri.fsPath,
        }
      },
      middleware: {
        provideDocumentColors: this.getColorMiddleware(),
      },
    }

    // Create the language client and start the client.
    const client = new LanguageClient('panda', 'Panda IntelliSense', serverOptions, clientOptions)
    client.outputChannel.appendLine('Starting PandaCss client extension...')

    // global error handler
    client.handleFailedRequest = (
      type: MessageSignature,
      token: vscode.CancellationToken | undefined,
      error: any,
      defaultValue: any,
      showNotification?: boolean,
    ) => {
      console.log('handleFailedRequest', { type, token, error, defaultValue, showNotification })
      console.trace()
      return defaultValue
    }

    return client
  }

  async connectToTsPlugin() {
    try {
      this.log('connecting to TS plugin...')
      this.tsApi = await getTsApi()
      this.log('connected to TS plugin !')
    } catch (err) {
      this.log('error loading TS', err)
    } finally {
      console.log(123)
    }
  }

  async start() {
    try {
      // Start the client. This will also launch the server
      this.statusBarItem.text = '🐼 Starting...'
      this.log('starting...')

      await this.client.start()

      this.log('client started !')
      this.statusBarItem.text = '🐼'
      this.statusBarItem.tooltip = 'Open current panda config'
    } catch (err) {
      this.log('error starting client', err)
    }
  }

  private createStatusBarItem() {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
    statusBarItem.text = '🐼 Loading...'
    statusBarItem.show()
    statusBarItem.command = 'panda-css-vscode.open-config'
    return statusBarItem
  }

  private registerSubscriptions() {
    // client
    this.onClearColors()

    // language-server
    this.syncActiveDocument()
    this.onLanguageServerReady()

    // ts-plugin
    this.syncExtensionSettings()
    this.syncTokenNames()
    this.onDidChangeActivePandaConfigPath()
  }

  /**
   * synchronize the active document with the extension LSP
   * so that we can retrieve the corresponding configPath (xxx/yyy/panda.config.ts)
   */
  private syncActiveDocument() {
    this.context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!editor) return
        if (!this.client.isRunning()) return
        if (editor.document.uri.scheme !== 'file') return

        const activeDocumentFilepath = editor.document.uri.fsPath
        this.client.sendNotification('$/panda-active-document-changed', { activeDocumentFilepath })
      }),
    )
  }

  /**
   * synchronize the extension settings with the TS server plugin
   * so that we can disable removing built-ins from the completion list if the user has disabled completions in the settings
   */
  private syncExtensionSettings() {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((update) => {
        this.log('onDidChangeConfiguration', update)
        if (!this.tsApi) return

        const settings = getFreshPandaSettings()
        this.tsApi.configurePlugin('@pandacss/ts-plugin', { type: 'update-settings', data: settings })
      }),
    )
  }

  /**
   * synchronize token names by configPath to the TS server plugin
   */
  private syncTokenNames() {
    this.context.subscriptions.push(
      this.client.onNotification('$/panda-token-names', (notif: { configPath: string; tokenNames: string[] }) => {
        if (!this.tsApi) return

        this.tsApi.configurePlugin('@pandacss/ts-plugin', { type: 'setup', data: notif })
        this.log({ type: 'setup', data: notif })
      }),
    )
  }

  /**
   * send initial config to the TS server plugin
   * so that it doesn't have to wait for the first file to be opened or settings to be changed
   */
  private onLanguageServerReady() {
    this.context.subscriptions.push(
      this.client.onNotification('$/panda-lsp-ready', async () => {
        const activeDocumentFilepath = getActiveDocFilepath()
        if (!activeDocumentFilepath) return

        try {
          // no need to await this one
          this.client.sendNotification('$/panda-active-document-changed', { activeDocumentFilepath })
          if (!this.tsApi) return

          const configPath = await this.client.sendRequest<string>('$/get-config-path', { activeDocumentFilepath })
          if (!configPath) return

          this.tsApi.configurePlugin('@pandacss/ts-plugin', {
            type: 'active-doc',
            data: { activeDocumentFilepath, configPath },
          })

          const settings = getFreshPandaSettings()
          this.tsApi.configurePlugin('@pandacss/ts-plugin', {
            type: 'update-settings',
            data: settings,
          })
        } catch (err) {
          this.log('error sending doc notif', err)
        }
      }),
    )
  }

  /**
   * synchronize the active document + its config path with the TS server plugin
   * so that it can remove the corresponding built-ins tokens names from the completion list
   */
  private onDidChangeActivePandaConfigPath() {
    this.context.subscriptions.push(
      this.client.onNotification(
        '$/panda-doc-config-path',
        (notif: { activeDocumentFilepath: string; configPath: string }) => {
          if (!this.tsApi) return

          this.tsApi.configurePlugin('@pandacss/ts-plugin', { type: 'active-doc', data: notif })
          this.log({ type: 'active-doc', data: notif })
        },
      ),
    )
  }

  /**
   * Remove the color hints decorators when settings change
   */
  private onClearColors() {
    let colorDecorationType: vscode.TextEditorDecorationType | undefined
    const clearColors = () => {
      if (colorDecorationType) {
        colorDecorationType.dispose()
        colorDecorationType = undefined
      }
    }
    this.context.subscriptions.push({ dispose: clearColors })
    this.client.onNotification('$/clear-colors', clearColors)
  }

  /**
   * emulate color hints with decorators to prevent the built-in vscode ColorPicker from showing on hover
   */
  private getColorMiddleware(): ColorProviderMiddleware['provideDocumentColors'] {
    const provideDocumentColors: ColorProviderMiddleware['provideDocumentColors'] = async (document, token, next) => {
      const settings = getFreshPandaSettings()
      if (!settings['color-hints.enabled']) return next(document, token)
      if (settings['color-hints.color-preview.enabled']) return next(document, token)

      if (!this.colorDecorationType) {
        this.colorDecorationType = vscode.window.createTextEditorDecorationType({
          before: {
            width: '0.8em',
            height: '0.8em',
            contentText: ' ',
            border: '0.1em solid',
            margin: '0.1em 0.2em 0',
          },
          dark: {
            before: {
              borderColor: '#eeeeee',
            },
          },
          light: {
            before: {
              borderColor: '#000000',
            },
          },
        })
      }

      const colors = (await next(document, token)) ?? []
      const editor = vscode.window.visibleTextEditors.find((editor) => editor.document === document)

      editor?.setDecorations(
        this.colorDecorationType,
        colors.map(({ range, color }) => {
          return {
            range,
            renderOptions: {
              before: {
                backgroundColor: `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${color.alpha})`,
              },
            },
          }
        }),
      )
      return []
    }

    return provideDocumentColors
  }

  private registerCommands() {
    this.registerShowOutputCommand()
    this.registerRestartCommand()
    this.registerOpenConfigCommand()
  }

  private registerRestartCommand() {
    const restartCmd = vscode.commands.registerCommand('panda-css-vscode.restart', async () => {
      this.statusBarItem.text = '🐼 Restarting...'
      this.statusBarItem.show()

      this.log('restarting...')
      await this.client.restart()

      this.client.outputChannel.show(true)
      this.statusBarItem.hide()
      this.log('restarted !')
    })

    this.context.subscriptions.push(restartCmd)
  }

  private registerShowOutputCommand() {
    const showOutputCmd = vscode.commands.registerCommand('panda-css-vscode.show-output', async () => {
      // Show and focus the output channel
      this.client.outputChannel.show(true)
    })

    this.context.subscriptions.push(showOutputCmd)
  }

  private registerOpenConfigCommand() {
    const openConfigCmd = vscode.commands.registerCommand('panda-css-vscode.open-config', async () => {
      const configPath = await this.client.sendRequest<string>('$/get-config-path')
      if (!configPath) return

      const configUri = vscode.Uri.file(configPath)
      const configDoc = await vscode.workspace.openTextDocument(configUri)
      await vscode.window.showTextDocument(configDoc)
    })

    this.context.subscriptions.push(openConfigCmd)
  }
}

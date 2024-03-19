import { defaultSettings, getFlattenedSettings, type PandaVSCodeSettings } from '@pandacss/extension-shared'
import type { Builder, PandaContext } from '@pandacss/node'
import { glob } from 'fast-glob'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
  DidChangeConfigurationNotification,
  ProposedFeatures,
  TextDocuments,
  createConnection,
  type Connection,
  type TextDocumentChangeEvent,
} from 'vscode-languageserver/node'
import { BuilderResolver } from './builder-resolver'
import { getDefaultCapabilities } from './capabilities'
import { uriToPath } from './uri-to-path'
import { ProjectHelper } from './project-helper'
import { CompletionProvider } from './completion-provider'
import { TokenFinder } from './token-finder'
import { registerColorHints } from './features/color-hints'
import { registerCompletion } from './features/completion'
import { registerDiagnostics } from './features/diagnostics'
import { registerHover } from './features/hover'
import { registerInlayHints } from './features/inlay-hints'
import { Deferred } from './deferred'

export type GetContext = () => Builder['context'] | undefined
interface InitializationOptions {
  activeDocumentFilepath: string | undefined
  settings: PandaVSCodeSettings
}

export class PandaLanguageServer {
  connection: Connection
  documents: TextDocuments<TextDocument>
  /**
   * wait for the extension to have resolved all the workspaces configs before doing anything
   */
  deferred: Deferred<void>

  builderResolver: BuilderResolver
  project: ProjectHelper
  tokenFinder: TokenFinder
  completions: CompletionProvider
  /**
   * current builder's context, used by most features as we can only be in one context at a time
   * depending on the active document
   */
  context: Builder['context']
  synchronizing = false as Promise<PandaContext | undefined> | false
  //
  settings: PandaVSCodeSettings | undefined
  activeDocumentFilepath = ''
  hasConfigurationCapability = false
  hasWorkspaceFolderCapability = false
  //
  events = new Map<string, Set<Function>>()

  constructor(private debug: boolean = false) {
    // Create a connection for the server, using Node's IPC as a transport.
    // Also include all preview / proposed LSP features.
    this.connection = createConnection(ProposedFeatures.all)
    this.documents = new TextDocuments(TextDocument)
    this.deferred = new Deferred()
    const getContext = () => this.getContext()

    this.project = new ProjectHelper(getContext)
    this.tokenFinder = new TokenFinder(getContext, this.project)
    this.completions = new CompletionProvider(
      getContext,
      this.getPandaSettings.bind(this),
      this.project,
      this.tokenFinder,
    )

    this.builderResolver = new BuilderResolver(({ configPath, builder }) => {
      const ctx = builder.context
      if (!ctx) return

      console.log('🐼 Context reloaded for:', configPath)
      this.context = ctx

      // sync ts plugin possible completion items
      const tokenNames = Array.from(new Set(ctx.tokens.allTokens.map((token) => token.path.slice(1).join('.'))))
      this.connection.sendNotification('$/panda-token-names', { configPath, tokenNames })
    })

    this.registerHandlers()

    this.documents.listen(this.connection)
    this.connection.listen()
  }

  log(...args: any[]) {
    this.debug && this.connection.console.log(args.join(' '))
  }

  /**
   * 1 - wait for the extension to have resolved all the workspaces configs before doing anything
   * 2 - Check await until tokens are synchronized if a synchronization process is happening.
   *
   * should be used AFTER checking that the feature is enabled through settings
   * and BEFORE getting the current context
   */
  async isReady(stepName: string) {
    // 1
    await this.deferred

    try {
      // 2
      const isSynchronizing = this.isSynchronizing()
      this.log('🤷 isReady', stepName, isSynchronizing)
      if (isSynchronizing) {
        await this.isSynchronizing()
      }

      this.log(stepName)
    } catch (error) {
      this.connection.console.error('error on step ' + stepName)
      this.connection.console.error(error as any)
    }
  }

  getContext = () => {
    return this.context
  }

  isSynchronizing() {
    return this.synchronizing
  }

  async getFreshPandaSettings() {
    return getFlattenedSettings((await this.connection.workspace.getConfiguration('panda')) ?? defaultSettings)
  }

  /**
   * Resolve current extension settings
   */
  async getPandaSettings(): Promise<PandaVSCodeSettings>
  async getPandaSettings<Key extends keyof PandaVSCodeSettings>(key: Key): Promise<PandaVSCodeSettings[Key]>
  async getPandaSettings<Key extends keyof PandaVSCodeSettings>(key?: Key) {
    const getter = (settings: PandaVSCodeSettings) => {
      return key ? settings[key] : settings
    }

    if (!this.hasConfigurationCapability) {
      return getter(defaultSettings)
    }

    if (!this.settings) {
      this.settings = await this.getFreshPandaSettings()
    }

    return getter(this.settings ?? defaultSettings)
  }

  async loadPandaContext(uriOrFilepath: string) {
    const filepath = uriToPath(uriOrFilepath) ?? uriOrFilepath

    try {
      console.log('🚧 Loading context for:', filepath)
      this.synchronizing = this.builderResolver.setup(filepath)
      await this.synchronizing
      console.log('✅ Loading context done:', filepath)
    } catch (err) {
      // Ignore
      this.synchronizing = false
      console.log('❌ Loading context failed!', err)
      return
    }

    this.synchronizing = false

    const builder = this.builderResolver.get(filepath)
    if (!builder || !builder.context) return

    console.log('🐼 Context loaded for:', filepath)
    this.context = builder.context

    return this.context
  }

  private async setupWorkspaceBuilders(rootPath: string) {
    console.log('🐼 Setup workspace builders...')
    const configPathList = await glob(`${rootPath}/**/panda.config.{ts,cts,mts,js,cjs,mjs}`, {
      cwd: rootPath,
      onlyFiles: true,
      absolute: true,
      ignore: ['**/node_modules/**'],
    })

    await Promise.all(
      configPathList.map(async (configPath) => {
        try {
          console.log('💼 Config setup at:', configPath)
          await this.builderResolver.create(configPath).setup(configPath)
          console.log('✅ Config setup done:', configPath)
        } catch (err) {
          // Ignore
          console.log('❌ Config setup failed!', configPath, err)
        }
      }),
    )
    console.log('🐼 Workspaces builders ready !')
  }

  private getClosestPandaContext(uri: string) {
    const filepath = uriToPath(uri) ?? uri

    const builder = this.builderResolver.get(filepath)
    if (!builder || !builder.context) return

    console.log('🐼 Found panda context! ✅ for', filepath)
    this.context = builder.context

    return this.context
  }

  private registerHandlers() {
    this.onInitializingConnection()
    this.onActiveDocumentChanged()
    this.onActivePandaConfigChanged()
    this.onDidChangedSettings()
    this.onDidChangePandaConfigs()
  }

  private onInitializingConnection() {
    this.connection.onInitialize((params) => {
      this.connection.console.log('🤖 Starting PandaCss LSP...')

      const capabilities = params.capabilities

      const { activeDocumentFilepath, settings } = params.initializationOptions as InitializationOptions
      if (activeDocumentFilepath) {
        this.activeDocumentFilepath = activeDocumentFilepath
        console.log('📄 Init Active document:', activeDocumentFilepath)
      }

      if (settings) {
        this.settings = settings
      }

      const serverCapabilitites = getDefaultCapabilities()
      if (!settings['color-hints.enabled']) {
        serverCapabilitites.colorProvider = false
      }

      if (!settings['inlay-hints.enabled']) {
        serverCapabilitites.inlayHintProvider = false
      }

      if (!settings['completions.enabled'] && serverCapabilitites.completionProvider) {
        serverCapabilitites.completionProvider.resolveProvider = false
      }

      if (!settings['hovers.enabled']) {
        serverCapabilitites.hoverProvider = false
      }

      // Check context support
      this.hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
      this.hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)

      this.onInitializedConnection()
      this.registerFeatures()

      return { capabilities: serverCapabilitites }
    })
  }

  private onInitializedConnection() {
    this.connection.onInitialized(async () => {
      this.connection.console.log('⚡ Connection initialized!')

      if (this.hasConfigurationCapability) {
        // Register for all configuration changes.
        this.connection.client.register(DidChangeConfigurationNotification.type, undefined)

        this.settings = await this.getFreshPandaSettings()
        this.debug = this.settings['debug.enabled'] ?? false
      }

      if (this.hasWorkspaceFolderCapability) {
        this.connection.workspace.onDidChangeWorkspaceFolders((_event) =>
          this.connection.console.log('Workspace folder change event received.'),
        )
      }

      const workspaceFolders = await this.connection.workspace.getWorkspaceFolders()
      const validFolders = workspaceFolders?.map((folder) => uriToPath(folder.uri) || '').filter((path) => !!path)

      console.log('📁 Workspace folders:', validFolders)
      await Promise.all(validFolders?.map((folder) => this.setupWorkspaceBuilders(folder)) ?? [])
      this.onWorkspacesReady()
    })
  }

  private onWorkspacesReady() {
    console.log('📁 Workspace folders setup ! ✅')

    this.synchronizing = false
    this.deferred.resolve()

    this.connection.sendNotification('$/panda-lsp-ready')

    if (this.activeDocumentFilepath) {
      const ctx = this.getClosestPandaContext(this.activeDocumentFilepath)

      if (ctx) {
        this.connection.console.log(`🐼 Found panda context! ✅ at ${ctx.conf.path}`)
      }
    }
  }

  private onActiveDocumentChanged() {
    this.connection.onNotification('$/panda-active-document-changed', (params) => {
      console.log('📄 Active document:', this.activeDocumentFilepath)
      this.activeDocumentFilepath = params.activeDocumentFilepath

      const configPath = this.builderResolver.findConfigDirpath(
        this.activeDocumentFilepath,
        (_, configPath) => configPath,
      )
      if (!configPath) return

      this.connection.sendNotification('$/panda-doc-config-path', {
        activeDocumentFilepath: this.activeDocumentFilepath,
        configPath,
      })
    })
  }

  private onActivePandaConfigChanged() {
    this.connection.onRequest('$/get-config-path', ({ activeDocumentFilepath }: { activeDocumentFilepath: string }) => {
      activeDocumentFilepath ??= this.activeDocumentFilepath
      if (!activeDocumentFilepath) return

      return this.builderResolver.findConfigDirpath(activeDocumentFilepath, (_, configPath) => {
        console.log('config path', configPath)
        return configPath
      })
    })
  }

  private onDidChangedSettings() {
    this.connection.onDidChangeConfiguration(async (_change) => {
      this.connection.sendNotification('$/clear-colors')
      this.connection.console.log('⌛ onDidChangeConfiguration')

      if (this.hasConfigurationCapability) {
        this.settings = await this.getFreshPandaSettings()
        this.debug = this.settings['debug.enabled'] ?? false
        console.log('🐼 Settings changed!', this.settings)
      }
    })
  }

  private onDidChangePandaConfigs() {
    this.connection.onDidChangeWatchedFiles(async ({ changes }) => {
      const events = this.events.get('onDidChangeWatchedFiles')
      events?.forEach((event) => event())

      changes.forEach(async (fileEvent) => {
        const filepath = uriToPath(fileEvent.uri) ?? fileEvent.uri
        this.connection.console.log('🔃 Reloading panda context for:' + filepath)
        await this.builderResolver.setup(filepath)
      })
    })
  }

  onDidChangeContent(onChange: (params: TextDocumentChangeEvent<TextDocument>) => void) {
    // Update diagnostics on document change
    this.documents.onDidChangeContent(async (params) => {
      await this.isReady('🐼 diagnostics - onDidChangeContent')

      // await when the server starts, then just get the context
      if (!this.getContext()) {
        await this.loadPandaContext(params.document.uri)
      }

      if (!this.getContext()) return

      onChange(params)
    })
  }

  /** Update diagnostics when watched file changes */
  registerDiagnosticsUpdateOnFilesChange(updateDocumentDiagnostics: ReturnType<typeof registerDiagnostics>) {
    const set = getOrCreateSet(this.events, 'onDidChangeWatchedFiles')
    set.add(async () => {
      await this.isReady('🐼 diagnostics - onDidChangeWatchedFiles')

      const ctx = this.getContext()
      if (!ctx) return

      // Update all opened documents diagnostics
      const docs = this.documents.all()
      docs.forEach((doc) => updateDocumentDiagnostics(doc))
    })
  }

  private registerFeatures() {
    console.log('⚡ Registering features')
    try {
      const settings = this.settings
      if (settings) {
        if (settings['color-hints.enabled']) {
          registerColorHints(this)
        }

        if (settings['inlay-hints.enabled']) {
          registerInlayHints(this)
        }

        if (settings['completions.enabled']) {
          registerCompletion(this)
        }

        if (settings['hovers.enabled']) {
          registerHover(this)
        }

        if (settings['diagnostics.enabled']) {
          const updateDocumentDiagnostics = registerDiagnostics(this)
          this.onDidChangeContent((params) => updateDocumentDiagnostics(params.document))
          this.registerDiagnosticsUpdateOnFilesChange(updateDocumentDiagnostics)
        }
      }
    } catch (err) {
      console.log('❌ Registering features failed!', err)
    }
  }
}

function getOrCreateSet<TKey, TValue>(map: Map<TKey, Set<TValue>>, key: TKey) {
  let set = map.get(key)
  if (!set) {
    map.set(key, new Set<TValue>())
    set = map.get(key)!
  }
  return set as Set<TValue>
}

/**
 * tsdown preset for this plugin's client bundle (adapted from
 * github.com/zhu1090093659/dsh-web-ui's shared/tsdown.client.ts, itself
 * adapted from the DSH checkout's packages/client/tsdown.client.ts — the
 * mobileBundle export is dropped, unused by this single-plugin repo). Emits
 * a closure-factory artifact: the bundle calls window.__ModuleLoader__.load
 * ({id, factory}) and resolves externals through the injected require
 * (loader module table — cordis DI entities, no globals, no import map).
 * The platform module list mirrors the shell's seed table in
 * `./web-platform.ts`.
 */
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { UserConfig } from 'tsdown'
import { PLATFORM_MODULES } from './web-platform.ts'

/**
 * Wire/type layers a client bundle may inline: browser-safe contract surfaces
 * with no runtime identity to share. Everything else under @deepseek-ai/* is
 * either a module-table entry (external) or a leak the purity gate rejects.
 */
const INLINE_SAFE = /^@deepseek-ai\/dsh-(host-apiproxy|session|llm|tools|brand)(\/|$)/

/** Generated descriptor/codec contribution with no shared runtime identity. */
const GENERATED_REMOTE = /^@deepseek-ai\/dsh-[a-z0-9]+(?:-[a-z0-9]+)*\/remote$/

/**
 * Documented TEMPORARY exemption, not a platform module: the snapshot-store
 * engine (defineStore) lives in dsh-client-runtime pending its promotion-time
 * rehoming. At runtime the lazy CJS table answers the require natively: the
 * runtime package is an immediately-tier row, its factory registers before
 * any dependent bundle materializes.
 */
const RUNTIME_STORE_EXEMPTION = '@deepseek-ai/dsh-client-runtime/client'

/** Externals resolved from the loader module table: the platform seed entries plus the documented runtime exemption. */
const CLIENT_EXTERNALS: readonly string[] = [...PLATFORM_MODULES, RUNTIME_STORE_EXEMPTION]

const REPOSITORY_ROOT = fileURLToPath(new URL('.', import.meta.url))

/** Rebase a physical lib-relative source onto a browser-friendly relative path. */
function browserSourcePath(source: string, sourcemapPath: string): string {
  if (!source.startsWith('.')) return source
  const physicalSource = resolvePath(dirname(sourcemapPath), source)
  return relative(REPOSITORY_ROOT, physicalSource).split(sep).join('/')
}

/**
 * Build the tsdown config for this plugin: the node-half lib build plus the
 * browser client bundle (emitted only when `src/client/index.ts` exists).
 * @param id - plugin id (package name), stamped into the __ModuleLoader__.load handoff.
 * @param libEntry - node-half entries.
 * @returns ENV-selected tsdown config for the current build face.
 */
export function clientBundle(id: string, libEntry: readonly string[]): BuildFaceConfig {
  const lib = clientLibraryConfig(id, libEntry)
  return ({ env }) => {
    const face = buildFace(env?.DSH_BUILD_FACE)
    const hasClient = existsSync(resolvePath(process.cwd(), 'src/client/index.ts'))
    const client = hasClient
      ? clientConfig(id, face === undefined ? 'src/client/index.ts' : 'lib/types/client/index.js')
      : undefined
    if (face === 'host') return client ? [] : [lib]
    if (face === 'client') return client ? [client] : []
    return client ? [lib, client] : [lib]
  }
}

type BuildFace = 'host' | 'client' | undefined

type BuildFaceConfig = (inlineConfig: Pick<UserConfig, 'env'>) => UserConfig[]

function buildFace(value: unknown): BuildFace {
  if (value === undefined || value === 'host' || value === 'client') return value
  throw new Error(`tsdown: --env.DSH_BUILD_FACE must be host or client, received ${String(value)}`)
}

function clientLibraryConfig(id: string, libEntry: readonly string[]): UserConfig {
  return {
    name: id,
    entry: [...libEntry],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    // The cordis framework resolves at runtime from the dsh profile tree,
    // never from this repo's install.
    external: ['@deepseek-ai/cordis'],
  }
}

function clientConfig(id: string, entry: string): UserConfig {
  return {
    name: `${id}/client`,
    entry: { client: entry },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...CLIENT_EXTERNALS],
    // tsdown auto-externalizes package dependencies; anything NOT in the
    // loader module table must inline instead (mathlive, this package's own
    // modules). noExternal forces bundling for everything but the table.
    noExternal: (specifier: string) => (CLIENT_EXTERNALS.includes(specifier) ? undefined : true),
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
      'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
    },
    plugins: [{
      // Bundle purity gate (mirrors the module-edge rules): platform seed
      // entries stay external, inline-safe wire layers inline, and every
      // other @deepseek-ai value import is a build error.
      name: 'dsh-client-bundle-purity',
      resolveId(source: string) {
        if (!source.startsWith('@deepseek-ai/')) return null
        if (CLIENT_EXTERNALS.includes(source)) return null
        if (INLINE_SAFE.test(source) || GENERATED_REMOTE.test(source)) return null
        throw new Error(
          `client bundle purity: "${source}" is not a platform module, an inline-safe wire layer, or a generated `
          + '/remote contribution — cross-plugin value imports are forbidden; collaborate through cordis services '
          + '(type-only imports are erased and never reach this gate)',
        )
      },
    }],
    outputOptions: {
      entryFileNames: 'client.js',
      sourcemapPathTransform: browserSourcePath,
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  }
}

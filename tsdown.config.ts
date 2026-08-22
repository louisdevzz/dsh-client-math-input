import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig } from 'tsdown'
import type { UserConfig } from 'tsdown'
import { clientBundle } from './tsdown.client.ts'

const NAME = '@louisdevzz/dsh-client-math-input'

const mathliveRequire = createRequire(import.meta.url)

/**
 * mathlive's package.json exports a conditional "." entry keyed on
 * browser/node/default; rolldown resolves it under Node's own condition set
 * (which matches "node" first, even though this build's `platform` is
 * "browser"), landing on `mathlive-ssr.min.mjs` — a headless rendering build
 * with no `<math-field>` custom element at all (verified: 0 occurrences of
 * "customElements" against 1 in the real browser build). Resolve the
 * interactive browser entry explicitly instead of trusting the exports map.
 */
function mathliveBrowserEntry(): string {
  // The bare specifier resolves under whichever condition Node's own
  // resolver picked (the "." export); every build artifact sits flat at the
  // package root regardless, so its directory is what we need.
  const anyEntry = mathliveRequire.resolve('mathlive')
  return join(dirname(anyEntry), 'mathlive.min.mjs')
}

export default defineConfig((inlineConfig) => {
  const configs = clientBundle(NAME, ['src/index.ts'])(inlineConfig)
  for (const config of configs) {
    if (config.name !== `${NAME}/client`) continue
    config.plugins = [
      ...(Array.isArray(config.plugins) ? config.plugins : []),
      {
        name: 'dsh-mathlive-browser-entry',
        resolveId(source: string) {
          return source === 'mathlive' ? { id: mathliveBrowserEntry() } : null
        },
      },
    ]
  }
  return configs as UserConfig[]
})

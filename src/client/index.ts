/**
 * Math-input plugin, browser half: registers the ƒx button into
 * ui-conversation's `conversation.input.left` seat and the MathLive editor
 * card into its `conversation.input.overlay` seat, sharing one
 * open/closed store between the two registrations (created once here, per
 * the slot system's cross-entry sharing rule — see ui-conversation's
 * `apply.ts`, which shares its chat store the same way).
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-conversation SlotMap merge (input.left/.overlay entries).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { MathInputButton } from './MathInputButton.tsx'
import { MathInputPopup } from './MathInputPopup.tsx'
import { createMathInputStore } from './store.ts'
import { en, zh, type MathInputKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The ƒx button and math-editor popup's copy. */
    mathInput: MathInputKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'mathInput'

/** Services required: the slot registry and the locale dictionary. */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: register both entries against the one shared store.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-client-math-input: dictionaries')

  const mathInputStore = createMathInputStore()

  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'math-input',
    order: 0,
    locale: NS,
    store: mathInputStore,
  }, MathInputButton))

  ctx.slots.inject('conversation.input.overlay', () => ctx.slots.register({
    name: 'conversation.input.overlay',
    id: 'math-input-popup',
    order: 10,
    locale: NS,
    store: mathInputStore,
  }, MathInputPopup))
}

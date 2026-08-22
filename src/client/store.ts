/**
 * Per-session open/closed state for the math-input popup, shared by the
 * composer-row button and the overlay popup entry (one handle created in
 * `apply`, passed to both `slots.register` calls).
 */
import { defineStore, type EngineStoreHandle } from '@deepseek-ai/dsh-client-runtime/client'

/** Popup visibility; per-session (the framework instantiates one per session). */
export interface MathInputState {
  open: boolean
}

/** Action spec handed to `defineStore` (draft-first, matching the immer producer signature). */
type MathInputActionsSpec = {
  openEditor: (draft: MathInputState) => void
  closeEditor: (draft: MathInputState) => void
}

/** Bound action face the framework hands to components: same verbs, draft param stripped. */
export type MathInputActions = {
  openEditor: () => void
  closeEditor: () => void
}

/**
 * Create the math-input popup's store handle.
 * @returns the store handle (spec + type + identity + factory in one).
 */
export function createMathInputStore(): EngineStoreHandle<MathInputState, MathInputActionsSpec> {
  return defineStore({
    init: (): MathInputState => ({ open: false }),
    actions: {
      openEditor: (d) => { d.open = true },
      closeEditor: (d) => { d.open = false },
    },
  })
}

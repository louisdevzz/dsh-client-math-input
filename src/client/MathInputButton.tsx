/** The ƒx trigger registered into ui-conversation's `conversation.input.left` seat. */
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (input.left/.overlay entries).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { createMathInputStore } from './store.ts'

/** Full props: the composer-row runtime kit, the shared open/closed store, and the mathInput locale seat. */
export type MathInputButtonProps =
  PropsRuntime<'conversation.input.left'>
  & PropsStore<ReturnType<typeof createMathInputStore>>
  & PropsLocale<'mathInput'>

/**
 * Toggle the math-editor popup (its sibling `conversation.input.overlay` entry).
 * @param props - store share (open/closed + toggle actions) and the locale seat.
 * @returns the ƒx button.
 */
export function MathInputButton({ useStore, actions, t }: MathInputButtonProps) {
  const open = useStore(s => s.open)
  return (
    <button
      type="button"
      title={t('button.aria')}
      aria-label={t('button.aria')}
      aria-pressed={open}
      onClick={() => { if (open) actions.closeEditor(); else actions.openEditor() }}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        fontStyle: 'italic',
        fontWeight: 600,
        fontSize: 13,
        color: open ? 'var(--dsw-alias-state-business-primary, #3964fe)' : 'inherit',
        background: open ? 'var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06))' : 'transparent',
      }}
    >
      ƒx
    </button>
  )
}

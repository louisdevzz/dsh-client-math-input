/**
 * The math-editor card registered into ui-conversation's
 * `conversation.input.overlay` seat: floats above the composer card (same
 * positioning rule as the slash menu / popupSelect shell — see
 * ui-input-trigger's MenuView), renders null while closed, and inserts the
 * field's LaTeX at the end of the draft, wrapped as a display-mode `$$...$$`
 * block (the model reads plain draft text; MarkdownText already renders that
 * back as math once sent).
 */
import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import type { PropsLocale, PropsRuntime, PropsStore } from '@deepseek-ai/dsh-client-ui-slots'
// Type-only: pulls the ui-conversation SlotMap merge (input.left/.overlay entries).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { MathField } from './MathField.tsx'
import type { createMathInputStore } from './store.ts'

/** Full props: the overlay-seat runtime kit (session's `useInput`/`inputActions`), the shared store, and the locale seat. */
export type MathInputPopupProps =
  PropsRuntime<'conversation.input.overlay'>
  & PropsStore<ReturnType<typeof createMathInputStore>>
  & PropsLocale<'mathInput'>

/**
 * Render the math-editor card while open; null while closed.
 * @param props - store share, the session's draft read/write kit, and the locale seat.
 * @returns the editor card, or null.
 */
export function MathInputPopup({ useStore, actions, useInput, inputActions, t }: MathInputPopupProps) {
  const open = useStore(s => s.open)
  const draft = useInput(s => s.draft)
  // MathLive owns the field's live value; this ref just carries it to Insert
  // without re-rendering the popup on every keystroke.
  const latexRef = useRef('')

  if (!open) return null

  const close = (): void => { actions.closeEditor() }
  const insert = (): void => {
    const latex = latexRef.current.trim()
    if (latex === '') { close(); return }
    const snippet = `$$${latex}$$`
    inputActions.setDraft(draft.length > 0 ? `${draft} ${snippet}` : snippet)
    close()
  }
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
  }

  return (
    <div
      role="dialog"
      aria-label={t('editor.title')}
      onKeyDown={onKeyDown}
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 4px)',
        left: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 'min(420px, 100%)',
        padding: 12,
        borderRadius: 10,
        background: 'var(--dsw-specific-menu, #fff)',
        border: '1px solid var(--dsw-alias-border-inverted, #d9d9d9)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{t('editor.title')}</span>
        <button
          type="button"
          aria-label={t('editor.close')}
          onClick={close}
          style={{ all: 'unset', cursor: 'pointer', fontSize: 13, padding: 4 }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          minHeight: 64,
          border: '1px solid var(--dsw-alias-border-inverted, #d9d9d9)',
          borderRadius: 8,
          padding: 8,
        }}
      >
        <MathField
          initialValue=""
          autoFocus
          onChange={(latex) => { latexRef.current = latex }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={close} style={{ padding: '6px 12px', borderRadius: 6 }}>
          {t('editor.cancel')}
        </button>
        <button
          type="button"
          onClick={insert}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            background: 'var(--dsw-alias-button-info-fill, #3964fe)',
            color: '#fff',
            border: 'none',
          }}
        >
          {t('editor.insert')}
        </button>
      </div>
    </div>
  )
}

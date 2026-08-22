/**
 * Thin imperative wrapper around MathLive's `<math-field>` custom element:
 * React cannot reliably pass non-primitive properties to a custom element
 * through JSX props, so the field's value and its virtual-keyboard/smart-fence
 * behavior are set directly on the element via a ref, mirroring how this
 * codebase's KaTeX renderer talks to its own DOM output.
 */
import { useEffect, useRef } from 'react'
import 'mathlive'
import type { MathfieldElement } from 'mathlive'
import { latexFromClipboardHtml } from './word-paste.ts'

export interface MathFieldProps {
  /** Initial LaTeX source; the field is uncontrolled past mount (mathlive owns editing state). */
  initialValue: string
  /** Fires on every edit with the field's current LaTeX. */
  onChange: (latex: string) => void
  /** Focus the field once it mounts. */
  autoFocus?: boolean
}

/**
 * Mount one MathLive editor field.
 * @param props - initial LaTeX, change callback, and the mount-time autofocus flag.
 * @returns the `<math-field>` element.
 */
export function MathField({ initialValue, onChange, autoFocus }: MathFieldProps) {
  const ref = useRef<MathfieldElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (el === null) return
    el.setAttribute('virtual-keyboard-mode', 'onfocus')
    el.setAttribute('smart-fence', 'true')
    el.value = initialValue
    const onInput = (): void => { onChange(el.value) }
    el.addEventListener('input', onInput)
    // Capture phase, ahead of MathLive's own paste handler: only acts (and
    // only then suppresses the default handling) when the clipboard's HTML
    // fallback carries a MathML island MathLive itself never looks for.
    // Everything else (plain text, already-supported formats, no MathML
    // present) falls through to MathLive's normal paste behavior untouched.
    const onPasteCapture = (e: ClipboardEvent): void => {
      const html = e.clipboardData?.getData('text/html') ?? ''
      const latex = latexFromClipboardHtml(html)
      if (latex === null) return
      e.preventDefault()
      e.stopPropagation()
      el.insert(latex, { format: 'latex', insertionMode: 'replaceSelection' })
      onChange(el.value)
    }
    el.addEventListener('paste', onPasteCapture, { capture: true })
    if (autoFocus === true) el.focus()
    return () => {
      el.removeEventListener('input', onInput)
      el.removeEventListener('paste', onPasteCapture, { capture: true })
    }
    // Mount-only: mathlive owns the field's live value past this point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <math-field ref={ref} />
}

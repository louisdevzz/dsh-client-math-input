/**
 * Best-effort LaTeX recovery for a paste originating from Word (or any other
 * app that puts MathML in its HTML clipboard fragment). MathLive's own paste
 * handler only reads `application/json+mathlive`, `application/json` (with a
 * compute engine loaded), `application/x-latex`, and `text/plain` — never
 * `text/html` — so a Word equation (which the OS clipboard carries as OMML
 * plus an HTML fallback, never as one of those four) silently pastes nothing.
 * Word since ~2018 additionally emits a real `<math>` MathML island inside
 * that HTML fallback for MathML-aware consumers; when present, this converts
 * it to LaTeX so the caller can insert it directly. No known way exists to
 * recover a formula from a Word paste that carries only OMML with no MathML
 * fallback — that case returns null and the caller should let MathLive's own
 * paste handler run as normal (plain text / already-supported formats still
 * work exactly as before).
 */
import { MathMLToLaTeX } from 'mathml-to-latex'

/**
 * Extract and convert the first MathML formula embedded in a clipboard HTML
 * fragment.
 * @param html - the `text/html` clipboard payload.
 * @returns LaTeX for the first `<math>` island found, or null when the
 * fragment has none or the conversion fails.
 */
export function latexFromClipboardHtml(html: string): string | null {
  if (html.trim() === '') return null
  let math: Element | null
  try {
    math = new DOMParser().parseFromString(html, 'text/html').querySelector('math')
  } catch {
    return null
  }
  if (math === null) return null
  try {
    const latex = MathMLToLaTeX.convert(math.outerHTML).trim()
    return latex === '' ? null : latex
  } catch {
    return null
  }
}

/**
 * Self-check for the Word-paste MathML recovery path. Run with `pnpm test`
 * (plain `node:test`, no framework — `DOMParser` comes from jsdom, installed
 * only for this check).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { latexFromClipboardHtml } from './word-paste.ts'

// word-paste.ts calls the ambient `DOMParser` (a real browser global at
// runtime); jsdom supplies it here for the Node-side check.
globalThis.DOMParser = new JSDOM('').window.DOMParser

test('recovers LaTeX from a MathML island in an HTML clipboard fragment', () => {
  const html = `
    <html><body>
      <!--[if mso]><span>ignored OMML fallback text</span><![endif]-->
      <math xmlns="http://www.w3.org/1998/Math/MathML">
        <mrow><mi>U</mi><mo>(</mo><mi>r</mi><mo>)</mo></mrow>
      </math>
    </body></html>
  `
  const latex = latexFromClipboardHtml(html)
  assert.ok(latex !== null)
  assert.match(latex, /U/)
})

test('returns null when the clipboard HTML has no MathML (e.g. Word without a MathML fallback)', () => {
  const html = '<html><body><img src="cid:equation.png"></body></html>'
  assert.equal(latexFromClipboardHtml(html), null)
})

test('returns null for empty clipboard HTML', () => {
  assert.equal(latexFromClipboardHtml(''), null)
})

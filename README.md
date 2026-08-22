# @louisdevzz/dsh-client-math-input

A dsh web GUI plugin: adds an "ƒx" button to the composer's tool row that
opens a [MathLive](https://mathlive.io) visual equation editor. Insert writes
the field's LaTeX into the draft as a `$$...$$` block, so the model receives
canonical LaTeX instead of hand-typed `\frac{...}{...}` syntax.

This is an out-of-tree plugin, not part of the deepseek-harness monorepo. See
[docs/user/develop/basic/publish.md](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md)
in that repo for the profile/bundle plugin model this package follows.

## How it works

- `src/index.ts` — host-side plugin half (no-op; this is a pure browser UI plugin).
- `src/client/index.ts` — browser half: registers a button into
  ui-conversation's `conversation.input.left` seat and the editor popup into
  its `conversation.input.overlay` seat, sharing one open/closed store
  between them.
- `src/client/MathField.tsx` — thin ref-based wrapper around MathLive's
  `<math-field>` custom element.
- `src/client/word-paste.ts` — best-effort recovery when the user pastes a
  Word equation into the field (see "Pasting from Word" below).

## Pasting from Word

MathLive's own paste handler only reads `application/json+mathlive`,
`application/json` (with a compute engine loaded — not enabled here),
`application/x-latex`, and `text/plain` off the clipboard. A Word equation is
none of those: Word's clipboard carries it as OMML/an image, with an HTML
fallback for other apps — so pasting a Word equation directly into MathLive
normally does nothing.

Word (since roughly 2018) additionally embeds a real `<math>` MathML island in
that HTML fallback. `word-paste.ts` intercepts `paste` in the capture phase,
checks the clipboard's `text/html` payload for a `<math>` element, and if
found converts it to LaTeX with [mathml-to-latex](https://github.com/asnunes/mathml-to-latex)
before MathLive's own handler ever sees the event. If no MathML is present
(older Word, or an equation copied as a plain image), the event is left alone
and MathLive's normal paste behavior runs exactly as before — plain text and
already-supported formats are unaffected.

This has not been verified against a real Word paste in a live browser (no
Word/browser available in the environment this was built in) — only against a
hand-constructed HTML fragment shaped like Word's documented MathML fallback
(`src/client/word-paste.test.ts`, `pnpm test`). If it doesn't work with your
Word version, open the browser devtools, run
`document.addEventListener('paste', e => console.log(e.clipboardData.getData('text/html')), true)`,
paste the equation, and check whether the logged HTML contains a `<math>` tag
at all — if not, there's nothing this plugin can recover from that paste
(would need a full OMML parser, not attempted here).

## Build

```sh
pnpm install
pnpm build   # tsc declarations (lib/types) + tsdown browser/node bundles (lib/)
```

`tsdown.config.ts` builds on `tsdown.client.ts` (adapted from DSH's internal
`packages/client/tsdown.client.ts` preset): the browser bundle is a
closure-factory artifact (`window.__ModuleLoader__.load({id, factory})`) that
resolves `react`, `@deepseek-ai/cordis`, `@deepseek-ai/dsh-client-ui-slots`,
`@deepseek-ai/dsh-client-ui-primitives`, and
`@deepseek-ai/dsh-client-runtime/client` through the running dsh app's own
module table instead of bundling them — those must stay the same singleton
instances as the rest of the app. `mathlive` is a genuine dependency and gets
bundled directly into `lib/client.js`.

One non-obvious fix baked into `tsdown.config.ts`: mathlive's package.json
exports a conditional entry keyed on `browser`/`node`/`default`, and rolldown
(running under Node) resolves it via the `node` condition — landing on
`mathlive-ssr.min.mjs`, a headless rendering build with no `<math-field>`
custom element at all. The config resolves `mathlive.min.mjs` explicitly
instead of trusting the exports map.

## Install into a local dsh profile

```sh
dsh plugin --profile web add link:/path/to/dsh-client-math-input
```

or, without the `dsh plugin` bundle machinery: `pnpm link` this package into
`$DSH_HOME/profiles/web` and add an `insert` row for
`@louisdevzz/dsh-client-math-input` to that profile's own `cordis.patch.yml`
(see `cordis.patch.yml` in this repo for the row shape).

## Known limitations

- No outside-click dismissal on the popup (closes via the ✕ button, Cancel,
  Insert, or Escape) — deliberately deferred; not needed to prove the
  LaTeX round-trip.
- Always inserts display-mode (`$$...$$`); no inline-math toggle.
- Types for `@deepseek-ai/dsh-client-*` are pinned to `^0.1.1-rc.2` (the `next`
  dist-tag) — the npm `latest` tag for these packages currently points at a
  much older, incompletely-published `0.0.1-rc.1` line; do not loosen these
  version pins to an unpinned range.
- Word-paste recovery only handles the case where Word's clipboard includes a
  MathML fallback; OMML-only paste (older Word, or Word configured without
  the MathML fallback) still silently does nothing. See "Pasting from Word"
  above.
- `lib/client.js` is ~1.5MB (mathlive + mathml-to-latex, both bundled since
  neither is a shared platform module) — fine for a manually-installed
  personal plugin, but not optimized for load time.

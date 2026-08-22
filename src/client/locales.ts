/** `mathInput` namespace dictionary: the ƒx button and the editor popup. */

/** English dictionary (the key-set source of truth). */
export const en = {
  'button.aria': 'Insert math (LaTeX)',
  'editor.title': 'Math editor',
  'editor.close': 'Close',
  'editor.cancel': 'Cancel',
  'editor.insert': 'Insert',
} satisfies Record<string, string>

/** The mathInput namespace key union. */
export type MathInputKey = keyof typeof en

/** Simplified Chinese dictionary, checked complete against the en key set. */
export const zh = {
  'button.aria': '插入数学公式（LaTeX）',
  'editor.title': '数学公式编辑器',
  'editor.close': '关闭',
  'editor.cancel': '取消',
  'editor.insert': '插入',
} satisfies Record<MathInputKey, string>

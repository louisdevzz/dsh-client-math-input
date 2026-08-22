/**
 * Host loader entry for the math-input plugin — runs in the DSH host process.
 * This plugin is pure browser UI (composer button + LaTeX popup); the host
 * half does nothing.
 */
import type { Context } from '@deepseek-ai/cordis'

/** Apply the host half (no host-side behavior). */
export function apply(ctx: Context): void {
  void ctx
}

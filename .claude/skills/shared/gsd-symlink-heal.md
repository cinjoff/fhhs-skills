# GSD CLI Symlink Self-Heal

Run this block before any `gsd-tools.cjs` call. Ensures the CLI symlink exists even if `/fh:setup` was never run.

```bash
# Ensure GSD CLI symlink exists (self-heals if /fh:setup wasn't run)
if [ ! -f "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" ]; then
  _FHHS="$(ls -d "$HOME/.claude/plugins/cache/fhhs-skills/fh"/*/ 2>/dev/null | sort | tail -1)"
  _FHHS="${_FHHS%/}"
  if [ -n "$_FHHS" ] && [ -d "$_FHHS/bin" ]; then
    mkdir -p "$HOME/.claude/get-shit-done"
    ln -sfn "$_FHHS/bin" "$HOME/.claude/get-shit-done/bin"
    [ -d "$_FHHS/hooks" ] && ln -sfn "$_FHHS/hooks" "$HOME/.claude/get-shit-done/hooks"
  fi
fi
```

After this block, `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs"` is safe to call.

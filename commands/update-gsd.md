<purpose>
GSD is bundled with fhhs-skills. This command redirects to the plugin update flow.
</purpose>

<process>

<step name="redirect">
GSD is fully bundled with fhhs-skills — there's no separate GSD installation to update.

To update GSD, update the fhhs-skills plugin:

```
Run /update to check for and install the latest version of fhhs-skills (which includes GSD).
```

After updating, the bundled GSD binary at `bin/gsd-tools.cjs` will be the latest version. The symlink at `$HOME/.claude/get-shit-done/bin/` automatically points to the updated binary.
</step>

</process>

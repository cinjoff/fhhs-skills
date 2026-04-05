# .project-tracker

This directory contains a local web dashboard that visualizes your project's progress. It reads data from `.planning/` and displays stages, current tasks, and recent activity in a browser-based dashboard.

## Quick Start

```bash
node server.cjs
```

Then open the URL printed in the terminal (default: `http://localhost:4111`).

The dashboard auto-updates in real time as files in `.planning/` change.

## Important

- This directory is **auto-generated** by the `/tracker` command and should be **gitignored**.
- Do not edit these files manually -- they will be overwritten on updates.
- The server has zero dependencies; it uses only Node.js built-ins.

For more information, see [fhhs-skills](https://github.com/FellowHashbrown/fhhs-skills).

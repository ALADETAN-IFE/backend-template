# Local Test Instructions

This file describes two ways to run the CLI locally for testing:

- `npm link`: develop locally and run the CLI as if it were installed.
- `npm pack` + `npx`: test the packaged tarball exactly like published package.

1) Using `npm link` (recommended for iterative development)

```bash
cd backend-template
npm install
npm link

# From the parent folder, run the CLI like a normal install:
cd ..
npx @ifecodes/backend-template test-js-mono
```

2) Using `npm pack` (tests the distributed tarball)

```bash
cd backend-template
# create the packaged tarball (ifecodes-backend-template-<version>.tgz)
rm -f *.tgz && npm pack

# from the parent folder, run the packaged CLI non-interactively
cd ..
npx --yes ./backend-template/ifecodes-backend-template-1.1.4.tgz test-js-mono
```

Notes:
- Use `test-js-mono` to run the JavaScript monolith smoke preset.
- Use `test-ts-mono` to run the TypeScript monolith smoke preset.
- Add `--yes` to `npx` to avoid the interactive "Ok to proceed? (y)" prompt.

Tips and Windows notes:
- If you use PowerShell, the commands above work as-is. If you see a prompt from `npx`, add `--yes` to auto-confirm.
- If testing multiple presets, replace `test-js-mono` with `test-ts-mono` or other presets your package supports.

If you want me to run these smoke tests from this environment now, tell me which preset to run and I'll execute it and report the results.

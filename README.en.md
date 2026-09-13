# dsh-round-rightclick

A radial right-click menu for DeepSeek Harness (DSH) Web. Right-click a specific turn in the conversation to run common session actions at the cursor.

[简体中文](README.md) · [Changelog](CHANGELOG.md)

![Release](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![License](https://img.shields.io/github/license/hmr-BH/dsh-round-rightclick)

## Why this plugin exists

Session actions in DSH are spread across the interface. The workspace folder has to be found in a sidebar, interrupting generation requires catching the right moment, and branching from an earlier turn is not available at all — the only option is copying the preceding conversation into a new session by hand and verifying nothing was missed.

The radial menu collects these actions in one place. Right-click a specific question or answer and six actions are arranged around the cursor, selectable by mouse or keyboard.

The central action is **Fork this turn**. Take a session with three completed turns:

```text
Turn 1: pin down the request
Turn 2: compare approaches
Turn 3: polish the copy
```

Forking turn 1 produces a session containing only turn 1; forking turn 2 produces one containing turns 1–2. The source session is left unchanged, so both can stay open for comparison. When a conversation drifts, work resumes from the turn before the drift instead of re-supplying context to a blank session.

The fork boundary is derived from the sequence number of that turn's `turn/end` event, not from the pointer position or the last event in the session, so the result is exactly the turn that was clicked. If the turn is still generating, or its end event has not loaded, the action is disabled and states why. It never degrades into "copy the whole session", which would produce an incorrect fork with no indication of the error.

## Interface

![Radial menu](assets/screenshots/radial-menu.png)

The default diameter is 240 CSS pixels. On small viewports the wheel shrinks and shifts inward rather than being clipped. The centre button shows which turn is currently locked in, and clicking it closes the menu. Results appear as a notification at the top of the page: a green check for success, a red warning for failure, with text describing the next step.

## The six actions

| Action | Purpose | Available when |
| --- | --- | --- |
| Open folder | Opens the session's workspace in the OS file manager | The session has a directory and DSH runs locally |
| Copy path | Writes the full workspace path to the clipboard | The browser permits clipboard writes |
| Copy session ID | Copies the current session's ID | A session is open |
| Interrupt | Stops the running generation or tool call, keeping the conversation | The session is running |
| Fork this turn | Creates a branch session carrying the conversation through that turn | The turn is complete and loaded |
| Export log | Downloads this session and its children as a log ZIP | The host exposes the export service |

## Install

### From a release tarball (recommended)

Download `dsh-round-rightclick-0.1.0.tgz` from [Releases](https://github.com/hmr-BH/dsh-round-rightclick/releases), then run:

```sh
dsh plugin --profile web add ./dsh-round-rightclick-0.1.0.tgz
```

Restart `dsh web` and refresh the page. The tarball contains built output, so neither pnpm nor a local build is required.

### From source

```sh
git clone https://github.com/hmr-BH/dsh-round-rightclick.git
cd dsh-round-rightclick
pnpm install --frozen-lockfile
pnpm run build
dsh plugin --profile web add .
```

Restart `dsh web` after a source install as well. To remove the plugin:

```sh
dsh plugin --profile web remove dsh-round-rightclick
```

## Interaction

- Right-click a completed question or answer to open the wheel.
- Left-click a sector to run it, or navigate with the arrow keys and press Enter.
- Releasing the right button never fires an action, so holding it while moving across sectors is safe.
- Escape, Tab, page scrolling, window blur, window resizing, and clicking outside the wheel all close the menu.
- The menu is locked while an action runs; repeated clicks do not issue a second request.
- Inputs, `contenteditable` regions, and other editable controls keep the browser's native context menu. The plugin does not take over these areas.

## Requirements and known limits

- DSH Web. The fork contract was verified during development against a locally installed `@deepseek-ai/dsh-api-session-controller` `0.1.2-rc.1` using `scripts/verify-installed-dsh.mjs`. Re-run that script when the host version differs.
- Node.js `^22.19.0` or `>=24.0.0`, required for source installs only. Builds use pnpm.
- A browser supporting SVG, CSS `clip-path`, and the Clipboard API.
- Windows has been verified locally. The macOS and Linux file-manager commands have test coverage but no on-device acceptance run; if Open folder misbehaves on either platform, an issue would be useful.
- Web page injection only. No TUI menu is provided.

## Privacy

No telemetry, no advertising, no remote service, and no additional API key. Every action runs only after a user click: it reads one snapshot of the current session, then asks the host to open a folder, interrupt, fork, or export, or writes text to the browser clipboard.

Exported logs contain the full conversation and tool output. Review them before sharing.

## Troubleshooting

**Right-click does nothing.** Confirm the plugin is installed under the `web` profile, restart `dsh web`, and refresh the page. The click must land on conversation content; the composer is deliberately excluded.

**"Fork this turn" is disabled.** Check that the right-click landed on a specific turn's question or answer, and that the turn has finished. If it is still generating, run Interrupt first and reopen the menu once the end event has loaded.

**Copy fails.** There are two common causes: the browser has not granted clipboard permission to the page, or the page is not served over localhost or HTTPS. The Clipboard API refuses writes in both cases.

**Open folder is unavailable in an SSH session.** This is intentional. The file manager can only launch on the machine running DSH; mapping it regardless would open a window on a server with no attached display, so the plugin refuses and reports the reason.

## Development

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node scripts/package-release.mjs
```

47 tests cover menu actions, turn resolution, host routing, clipboard feedback, and component interaction. With DSH installed locally, the fork contract check can also run against the real host:

```sh
node scripts/verify-installed-dsh.mjs "path/to/installed/@deepseek-ai/dsh"
```

Code layout:

```text
src/client/RadialMenu.tsx  rendering, keyboard navigation, action feedback
src/client/menu-layout.ts  wheel geometry, sector hit areas, viewport avoidance
src/client/fork-target.ts  fork turn resolution
src/client/index.ts        wiring to the host session service
src/client/styles.ts       wheel, icon, and notification styles
src/opener.ts              directory validation and file-manager launch
tests/                     unit and component tests
```

## License

[MIT](LICENSE). A community plugin maintained by an individual, with no affiliation to DeepSeek.

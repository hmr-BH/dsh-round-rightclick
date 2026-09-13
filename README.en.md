# dsh-round-rightclick

A radial right-click menu for DeepSeek Harness. Right-click a specific turn in the conversation to run common session actions at the cursor.

[简体中文](README.md) · [Changelog](CHANGELOG.md)

![Release](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![npm](https://img.shields.io/npm/v/dsh-round-rightclick)
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

## Screenshot

![Radial menu](assets/screenshots/radial-menu.png)

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

### From npm (recommended)

```sh
dsh plugin --profile web add dsh-round-rightclick
```

Restart `dsh web` and refresh the page. The npm package ships built output, so neither pnpm nor a local build is required; a prebuilt publish does not trigger a build approval either.

### From a release tarball

Download the `.tgz` attached to the relevant [Release](https://github.com/hmr-BH/dsh-round-rightclick/releases), then run:

```sh
dsh plugin --profile web add ./dsh-round-rightclick-<version>.tgz
```

Restart `dsh web` and refresh the page. The tarball contains built output as well.

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

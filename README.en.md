# dsh-round-rightclick

Right-click anywhere in a DeepSeek Harness (DSH) Web conversation and a radial menu pops up under your cursor with the session actions you actually reach for.

[简体中文](README.md) · [Changelog](CHANGELOG.md)

![Release](https://img.shields.io/github/v/release/hmr-BH/dsh-round-rightclick?display_name=tag&sort=semver)
![License](https://img.shields.io/github/license/hmr-BH/dsh-round-rightclick)

## Why I built it

Session actions in DSH are scattered. The workspace folder is buried in a sidebar, interrupting means catching the right moment, and branching off from some earlier turn simply wasn't a thing — you had to copy the conversation into a new session by hand and hope you didn't miss a chunk.

The wheel collects those actions in one place. Right-click a specific question or answer, and six actions ring the cursor. Mouse and keyboard both work.

The one I use constantly is **Fork this turn**. Say a session ran three turns:

```text
Turn 1: pin down the request
Turn 2: compare approaches
Turn 3: polish the copy
```

Fork turn 1 and the new session contains only turn 1. Fork turn 2 and it carries turns 1–2. The source session is left alone, so you can keep both open side by side. When a conversation drifts, you restart from just before it drifted instead of feeding context into a blank session all over again.

The fork point comes from that turn's `turn/end` event sequence number — not the pointer position, not the last event in the session. So the turn you click is the turn you get. If the turn is still generating, or its end event hasn't loaded yet, the action is greyed out with the reason spelled out. It never quietly degrades into "copy the whole session"; a wrong fork that says nothing is worse than no fork at all.

## What it looks like

![Radial menu](assets/screenshots/radial-menu.png)

240 CSS pixels across by default. On small viewports the wheel shrinks and pulls inward rather than getting clipped. The centre button shows which turn is currently locked in, and clicking it closes the menu. Results surface as a toast at the top of the page: green check on success, red warning on failure, with text saying what to do next.

## The six actions

| Action | What it does | Available when |
| --- | --- | --- |
| Open folder | Opens this session's workspace in your OS file manager | The session has a directory and DSH runs locally |
| Copy path | Puts the full workspace path on the clipboard | The browser allows clipboard writes |
| Copy session ID | Copies the current session's ID | A session is open |
| Interrupt | Stops the running generation or tool call, keeping the conversation | The session is running |
| Fork this turn | Opens a new branch session carrying the conversation through that turn | The turn is complete and loaded |
| Export log | Downloads this session and its children as a log ZIP | The host exposes the export service |

## Install

### From a release tarball (recommended)

Grab `dsh-round-rightclick-0.1.0.tgz` from [Releases](https://github.com/hmr-BH/dsh-round-rightclick/releases), then:

```sh
dsh plugin --profile web add ./dsh-round-rightclick-0.1.0.tgz
```

Restart `dsh web` and refresh the page. The tarball ships built output, so you need neither pnpm nor a local build.

### From source

```sh
git clone https://github.com/hmr-BH/dsh-round-rightclick.git
cd dsh-round-rightclick
pnpm install --frozen-lockfile
pnpm run build
dsh plugin --profile web add .
```

Restart `dsh web` here too. To remove it:

```sh
dsh plugin --profile web remove dsh-round-rightclick
```

## Using it

- Right-click a completed question or answer; the wheel appears.
- Left-click a sector to run it, or move with the arrow keys and press Enter.
- Releasing the right button never fires an action, so holding it down and dragging across sectors is safe.
- Escape, Tab, scrolling, window blur, resizing, or clicking outside the wheel all close it.
- The menu locks while an action runs, so mashing it won't send the request twice.
- Inputs, `contenteditable` regions, and other editable controls keep the browser's own context menu. The plugin doesn't take it over.

## Requirements and known limits

- DSH Web. The fork contract was checked against a locally installed `@deepseek-ai/dsh-api-session-controller` `0.1.2-rc.1` using `scripts/verify-installed-dsh.mjs`. If your host version differs, run that script again.
- Node.js `^22.19.0` or `>=24.0.0`, only for source installs. Builds use pnpm.
- A browser with SVG, CSS `clip-path`, and Clipboard API support.
- Windows is what I run daily. The macOS and Linux file-manager commands have test coverage but no on-device acceptance run yet — if Open folder misbehaves there, please file an issue.
- Web page injection only. There is no TUI menu.

## Privacy

No telemetry, no ads, no remote service, no extra API key. Every action runs only after you click: it reads one snapshot of the current session, then asks the host to open a folder, interrupt, fork, or export — or writes a string to the browser clipboard. That's the whole surface.

Exported logs contain the full conversation and tool output. Read them before sending them anywhere.

## Troubleshooting

**Right-click does nothing.** Check the plugin is installed under the `web` profile, restart `dsh web`, and refresh. Also make sure you're clicking conversation content — the composer is deliberately excluded.

**"Fork this turn" is greyed out.** Two things to check: whether you right-clicked an actual turn rather than the gaps between them, and whether that turn has finished. If it's still generating, hit Interrupt first, then reopen the menu once the end event has loaded.

**Copy fails.** Usually one of two causes: the browser hasn't granted clipboard permission to this page, or the page isn't served from localhost or HTTPS. The Clipboard API refuses both.

**Open folder is unavailable in an SSH session.** On purpose. The file manager can only launch on the machine running DSH; mapping it anyway would open a window on a server nobody is looking at, so the plugin refuses and tells you why.

## Development

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
node scripts/package-release.mjs
```

47 tests cover menu actions, turn resolution, host routing, clipboard feedback, and component interaction. With DSH installed locally you can also run the fork contract check against the real host:

```sh
node scripts/verify-installed-dsh.mjs "path/to/installed/@deepseek-ai/dsh"
```

Rough layout of the code:

```text
src/client/RadialMenu.tsx  rendering, keyboard navigation, action feedback
src/client/menu-layout.ts  wheel geometry, sector hit areas, viewport avoidance
src/client/fork-target.ts  fork turn resolution
src/client/index.ts        wiring to the host session service
src/client/styles.ts       wheel, icon, and toast styles
src/opener.ts              directory validation and file-manager launch
tests/                     unit and component tests
```

## License

[MIT](LICENSE). A community plugin maintained by an individual, with no affiliation to DeepSeek.

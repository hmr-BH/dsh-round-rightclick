window.__ModuleLoader__.load({ id: "dsh-round-rightclick", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  OPEN_DIR_ROUTE: () => OPEN_DIR_ROUTE,
  OVERLAY_ID: () => OVERLAY_ID,
  PIE_ACTION_IDS: () => PIE_ACTION_IDS,
  RadialMenu: () => RadialMenu,
  apply: () => apply,
  createActionDeps: () => createActionDeps,
  downloadSessionExport: () => downloadSessionExport,
  hitTestPie: () => hitTestPie,
  inject: () => inject,
  isActionEnabled: () => isActionEnabled,
  isSessionConversationSurface: () => isSessionConversationSurface,
  runAction: () => runAction,
  sliceCssMidDegrees: () => sliceCssMidDegrees,
  sliceCssSpanDegrees: () => sliceCssSpanDegrees,
  sliceMidAngle: () => sliceMidAngle
});
module.exports = __toCommonJS(index_exports);

// src/client/RadialMenu.tsx
var import_react = require("react");

// src/client/actions.ts
var PIE_ACTION_IDS = [
  "open-dir",
  "copy-cwd",
  "copy-session-id",
  "stop",
  "fork",
  "export"
];
function isActionEnabled(id, state) {
  switch (id) {
    case "open-dir":
    case "copy-cwd":
      return state.cwd !== "";
    case "copy-session-id":
    case "export":
      return state.sessionId !== void 0 && state.sessionId !== "";
    case "fork":
      return Boolean(state.sessionId) && state.forkTarget?.kind === "ready";
    case "stop":
      return Boolean(state.sessionId) && state.running;
  }
}
async function runAction(id, state, deps) {
  if (!isActionEnabled(id, state)) return;
  switch (id) {
    case "open-dir":
      await deps.openDirectory(state.cwd);
      return;
    case "copy-cwd":
      await deps.clipboardWrite(state.cwd);
      return;
    case "copy-session-id":
      await deps.clipboardWrite(state.sessionId);
      return;
    case "stop":
      await deps.cancel(state.sessionId);
      return;
    case "fork":
      if (state.forkTarget?.kind === "ready") await deps.fork(state.sessionId, state.forkTarget.atSeq);
      return;
    case "export":
      await deps.exportLog(state.sessionId);
      return;
  }
}
function sessionLogZipFilename(sessionId) {
  return `dsh-session-${sessionId.replace(/[^A-Za-z0-9_-]/g, "_")}.zip`;
}
async function downloadSessionExport(sessionId, deps) {
  const url = new URL("/api/session.export", deps.hostBase());
  url.searchParams.set("sessionId", sessionId);
  url.searchParams.set("includeDescendants", "true");
  const response = await deps.fetch(url, { method: "HEAD" });
  if (!response.ok) {
    throw new Error(`Export failed: HTTP ${String(response.status)}`);
  }
  deps.save(url.toString(), sessionLogZipFilename(sessionId));
}
function hostBase() {
  const origin = globalThis.location?.origin;
  return origin !== void 0 && origin !== "null" ? origin : "http://dsh.internal";
}

// src/client/locales.ts
var NS = "dsh-round-rightclick";
var zh = {
  "open-dir": "\u6253\u5F00\u76EE\u5F55",
  "copy-cwd": "\u590D\u5236\u8DEF\u5F84",
  "copy-session-id": "\u590D\u5236\u4F1A\u8BDD ID",
  stop: "\u6253\u65AD",
  fork: "\u4ECE\u6B64\u8F6E\u5206\u53C9",
  export: "\u5BFC\u51FA\u65E5\u5FD7",
  "open-dir.description": "\u5728\u7CFB\u7EDF\u6587\u4EF6\u7BA1\u7406\u5668\u4E2D\u6253\u5F00\u6B64\u4F1A\u8BDD\u7684\u5DE5\u4F5C\u76EE\u5F55",
  "copy-cwd.description": "\u590D\u5236\u6B64\u4F1A\u8BDD\u5DE5\u4F5C\u76EE\u5F55\u7684\u5B8C\u6574\u8DEF\u5F84",
  "copy-session-id.description": "\u590D\u5236\u6B64\u4F1A\u8BDD\u7684\u552F\u4E00 ID",
  "stop.description": "\u6253\u65AD\u5F53\u524D\u751F\u6210\u6216\u5DE5\u5177\u6267\u884C\uFF0C\u4FDD\u7559\u5DF2\u6709\u5BF9\u8BDD",
  "fork.description": "\u4FDD\u7559\u622A\u81F3\u7B2C {turn} \u8F6E\u7684\u5B8C\u6574\u5BF9\u8BDD\uFF0C\u5E76\u6253\u5F00\u65B0\u7684\u5206\u652F\u4F1A\u8BDD",
  "export.description": "\u4E0B\u8F7D\u6B64\u4F1A\u8BDD\u53CA\u5B50\u4F1A\u8BDD\u7684\u65E5\u5FD7 ZIP \u6587\u4EF6",
  "open-dir.success": "\u5DF2\u8BF7\u6C42\u6253\u5F00\u5DE5\u4F5C\u76EE\u5F55",
  "copy-cwd.success": "\u5DE5\u4F5C\u76EE\u5F55\u8DEF\u5F84\u5DF2\u590D\u5236",
  "copy-session-id.success": "\u4F1A\u8BDD ID \u5DF2\u590D\u5236",
  "stop.success": "\u5DF2\u53D1\u9001\u6253\u65AD\u8BF7\u6C42",
  "fork.success": "\u5DF2\u4ECE\u7B2C {turn} \u8F6E\u521B\u5EFA\u5E76\u6253\u5F00\u5206\u652F\u4F1A\u8BDD",
  "export.success": "\u5DF2\u5F00\u59CB\u4E0B\u8F7D\u4F1A\u8BDD\u65E5\u5FD7",
  "open-dir.pending": "\u6B63\u5728\u6253\u5F00\u5DE5\u4F5C\u76EE\u5F55\u2026",
  "copy-cwd.pending": "\u6B63\u5728\u590D\u5236\u8DEF\u5F84\u2026",
  "copy-session-id.pending": "\u6B63\u5728\u590D\u5236\u4F1A\u8BDD ID\u2026",
  "stop.pending": "\u6B63\u5728\u8BF7\u6C42\u6253\u65AD\u2026",
  "fork.pending": "\u6B63\u5728\u4ECE\u7B2C {turn} \u8F6E\u521B\u5EFA\u5206\u652F\u2026",
  "export.pending": "\u6B63\u5728\u51C6\u5907\u4F1A\u8BDD\u65E5\u5FD7\u2026",
  menu: "\u4F1A\u8BDD\u5FEB\u6377\u83DC\u5355",
  choose: "\u9009\u62E9\u64CD\u4F5C",
  cancel: "\u5173\u95ED\u83DC\u5355",
  keys: "\u65B9\u5411\u952E\u9009\u62E9 \xB7 Enter \u6267\u884C \xB7 Esc \u5173\u95ED",
  turn: "\u7B2C {turn} \u8F6E",
  "no-turn": "\u8BF7\u5728\u8981\u5206\u53C9\u7684\u63D0\u95EE\u6216\u56DE\u590D\u4E0A\u53F3\u952E",
  unfinished: "\u6B64\u8F6E\u5C1A\u672A\u7ED3\u675F\uFF0C\u7ED3\u675F\u6216\u6253\u65AD\u540E\u53EF\u5206\u53C9",
  unavailable: "\u6B64\u8F6E\u8BB0\u5F55\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u7B49\u5F85\u52A0\u8F7D\u540E\u91CD\u65B0\u6253\u5F00\u83DC\u5355",
  "no-directory": "\u6B64\u4F1A\u8BDD\u672A\u8BBE\u7F6E\u5DE5\u4F5C\u76EE\u5F55",
  idle: "\u5F53\u524D\u6CA1\u6709\u6B63\u5728\u8FDB\u884C\u7684\u751F\u6210\u6216\u5DE5\u5177\u6267\u884C",
  busy: "\u6B63\u5728\u5904\u7406\u4E0A\u4E00\u9879\u64CD\u4F5C\uFF0C\u8BF7\u7A0D\u5019",
  failed: "\u64CD\u4F5C\u672A\u5B8C\u6210\uFF0C\u8BF7\u91CD\u8BD5",
  "clipboard-denied": "\u65E0\u6CD5\u5199\u5165\u526A\u8D34\u677F\uFF0C\u8BF7\u5141\u8BB8\u6D4F\u89C8\u5668\u8BBF\u95EE\u526A\u8D34\u677F\u540E\u91CD\u8BD5",
  "network-error": "\u65E0\u6CD5\u8FDE\u63A5\u672C\u5730\u670D\u52A1\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5\u540E\u91CD\u8BD5",
  dismiss: "\u5173\u95ED\u63D0\u793A"
};
var en = {
  "open-dir": "Open folder",
  "copy-cwd": "Copy path",
  "copy-session-id": "Copy session ID",
  stop: "Interrupt",
  fork: "Fork this turn",
  export: "Export log",
  "open-dir.description": "Open this session\u2019s workspace in your file manager",
  "copy-cwd.description": "Copy the full workspace directory path",
  "copy-session-id.description": "Copy this session\u2019s unique ID",
  "stop.description": "Interrupt generation or tool execution and keep the conversation",
  "fork.description": "Keep the conversation through turn {turn} and open a new branch",
  "export.description": "Download this session and its children as a log ZIP",
  "open-dir.success": "Requested to open the workspace",
  "copy-cwd.success": "Workspace path copied",
  "copy-session-id.success": "Session ID copied",
  "stop.success": "Interrupt requested",
  "fork.success": "Created and opened a branch from turn {turn}",
  "export.success": "Session log download started",
  "open-dir.pending": "Opening workspace\u2026",
  "copy-cwd.pending": "Copying path\u2026",
  "copy-session-id.pending": "Copying session ID\u2026",
  "stop.pending": "Requesting interruption\u2026",
  "fork.pending": "Creating a branch from turn {turn}\u2026",
  "export.pending": "Preparing session log\u2026",
  menu: "Session shortcuts",
  choose: "Choose action",
  cancel: "Close menu",
  keys: "Arrows to select \xB7 Enter to run \xB7 Esc to close",
  turn: "Turn {turn}",
  "no-turn": "Right-click the question or answer you want to branch from",
  unfinished: "This turn is still running; finish or interrupt it before branching",
  unavailable: "This turn is not loaded yet; reopen the menu after loading",
  "no-directory": "This session has no workspace directory",
  idle: "No generation or tool execution is running",
  busy: "An action is already in progress",
  failed: "Action failed. Please retry",
  "clipboard-denied": "Clipboard access failed. Allow clipboard access and retry",
  "network-error": "Cannot reach the local service. Check the connection and retry",
  dismiss: "Dismiss notification"
};
function dictionaryForDocument() {
  const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
  return lang === "" || lang.toLowerCase().startsWith("zh") ? zh : en;
}
function withTurn(text, state) {
  return text.replace("{turn}", String(state.forkTarget?.turn ?? ""));
}
function actionDescription(id, state, copy) {
  if ((id === "open-dir" || id === "copy-cwd") && state.cwd === "") return copy["no-directory"];
  if (id === "stop" && !state.running) return copy.idle;
  if (id === "fork" && state.forkTarget?.kind !== "ready") return copy[state.forkTarget?.kind ?? "no-turn"];
  return withTurn(copy[`${id}.description`], state);
}
function actionError(error, id, copy) {
  if (id === "copy-cwd" || id === "copy-session-id") return copy["clipboard-denied"];
  if (error instanceof TypeError) return copy["network-error"];
  return `${copy[id]}\uFF1A${copy.failed}`;
}

// src/client/styles.ts
var TAG_ID = "dsh-round-rightclick/radial";
var CSS = `
[data-dsh-rr-layer] { --dsw-corner-shape: round; position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font-family: var(--dsw-font-family, system-ui, sans-serif); }
[data-dsh-rr-catcher] { position: fixed; inset: 0; pointer-events: auto; }
/* \u5BBF\u4E3B\u4E3B\u9898\u4F1A\u7ED9\u6240\u6709\u5143\u7D20\u8BBE\u7F6E\u8D85\u692D\u5706\uFF0C\u5706\u76D8\u53CA\u5176\u540C\u5FC3\u5706\u5FC5\u987B\u660E\u786E\u4F7F\u7528\u6807\u51C6\u5706\u5F27\u3002 */
[data-dsh-rr-pie], [data-dsh-rr-pie]::before, [data-dsh-rr-pie]::after, [data-dsh-rr-hole], [data-dsh-rr-action] { corner-shape: round; }
[data-dsh-rr-pie] { position: fixed; width: var(--dsh-rr-size); height: var(--dsh-rr-size); transform: translate(-50%, -50%); pointer-events: auto; border-radius: 50%; overflow: visible; color: #dce4ed; background: radial-gradient(circle at 40% 25%, #292e34, #181b20 75%); box-shadow: 0 0 0 1px rgb(188 207 224 / .12), 0 0 0 4px rgb(147 186 220 / .045), 0 10px 30px rgb(0 0 0 / .4), 0 0 22px rgb(129 195 249 / .13); animation: dsh-rr-open .16s ease-out; }
[data-dsh-rr-pie]::before { content: ''; position: absolute; inset: 3%; border-radius: 50%; border: 1px solid rgb(200 219 237 / .15); box-shadow: inset 0 0 25px rgb(0 0 0 / .2); pointer-events: none; z-index: 3; }
[data-dsh-rr-pie]::after { content: ''; position: absolute; inset: 3%; border-radius: 50%; background: repeating-conic-gradient(from -30deg, rgb(209 224 236 / .14) 0deg .45deg, transparent .45deg 60deg); mask: radial-gradient(circle, transparent 0 calc(var(--dsh-rr-hole) + 1px), #000 calc(var(--dsh-rr-hole) + 2px)); pointer-events: none; z-index: 3; }
[data-dsh-rr-hole] { appearance: none; box-sizing: border-box; position: absolute; left: 50%; top: 50%; width: calc(var(--dsh-rr-hole) * 2); height: calc(var(--dsh-rr-hole) * 2); margin: 0; padding: 8px; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; font: inherit; color: #c3d1df; border-radius: 50%; background: radial-gradient(circle at 40% 30%, #343c45, #242a31); border: 1px solid rgb(212 230 245 / .19); box-shadow: inset 0 0 0 7px rgb(255 255 255 / .025), 0 0 0 5px rgb(0 0 0 / .12), 0 0 22px rgb(165 206 239 / .08); z-index: 4; cursor: pointer; }
[data-dsh-rr-hole] strong { font-size: clamp(10px, calc(var(--dsh-rr-size) * .046), 11px); font-weight: 550; }
[data-dsh-rr-hole] span { font: 10px/1 system-ui, sans-serif; color: #8997a7; letter-spacing: .08em; }
[data-dsh-rr-hole]:hover { border-color: #789ab6; }
[data-dsh-rr-hole]:focus-visible { outline: 2px solid #8bcaff; outline-offset: 3px; }
[data-dsh-rr-action] { appearance: none; position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #dce4ed; cursor: pointer; z-index: 2; transition: background .16s, color .16s; }
[data-dsh-rr-action][data-active]:not([data-disabled]), [data-dsh-rr-action]:focus-visible:not([data-disabled]) { background: radial-gradient(circle, rgb(100 190 250 / .06) 15%, rgb(109 188 249 / .16) 55%, rgb(133 206 255 / .3)); color: #fff; outline: none; }
[data-dsh-rr-action][data-disabled] { color: #78818e; cursor: not-allowed; }
[data-dsh-rr-action][data-active][data-disabled] { background: rgb(255 255 255 / .025); }
[data-dsh-rr-action][data-action="stop"][data-active]:not([data-disabled]) { color: #ffd7be; background: radial-gradient(circle, transparent 18%, rgb(237 162 108 / .2)); }
[data-dsh-rr-action]:active:not([data-disabled]) [data-dsh-rr-label] { transform: translate(-50%, -50%) scale(.95); }
[data-dsh-rr-label] { position: absolute; width: 30%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 5px; color: inherit; font: 500 clamp(10px, calc(var(--dsh-rr-size) * .046), 11px)/1.3 system-ui, sans-serif; text-align: center; user-select: none; pointer-events: none; transition: transform .12s; }
[data-dsh-rr-icon] { display: block; flex: none; }
[data-dsh-rr-label] [data-dsh-rr-icon] { width: calc(var(--dsh-rr-size) * .083); height: calc(var(--dsh-rr-size) * .083); }
[data-active]:not([data-disabled]) [data-dsh-rr-icon] { filter: drop-shadow(0 0 7px rgb(180 222 255 / .5)); }
[data-dsh-rr-detail] { position: absolute; left: 50%; top: calc(100% + 10px); width: max-content; max-width: min(var(--dsh-rr-size), calc(100vw - 24px)); box-sizing: border-box; transform: translateX(-50%); padding: 5px 9px; border: 1px solid #434d5c; border-radius: 8px; color: #b5c3d3; background: rgb(23 27 33 / .96); box-shadow: 0 4px 12px rgb(0 0 0 / .2); font: 11px/1.4 system-ui, sans-serif; text-align: center; pointer-events: none; z-index: 5; visibility: hidden; }
[data-dsh-rr-detail][data-visible] { visibility: visible; }
[data-dsh-rr-toast] { position: fixed; left: 50%; top: 16px; bottom: auto; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; width: max-content; max-width: min(480px, calc(100vw - 32px)); box-sizing: border-box; padding: 10px 12px; border: 1px solid rgb(255 255 255 / .14); border-radius: 12px; color: #f6f8fb; background: rgb(22 27 35 / .96); box-shadow: 0 6px 24px rgb(0 0 0 / .3); backdrop-filter: blur(12px); font-size: 13px; line-height: 20px; font-weight: 500; animation: dsh-rr-toast-in .18s ease-out; }
[data-dsh-rr-toast-text] { min-width: 0; overflow-wrap: anywhere; }
[data-dsh-rr-toast][data-kind="success"] > [data-dsh-rr-icon] { color: #42bd7b; }
[data-dsh-rr-toast][data-kind="error"] > [data-dsh-rr-icon] { color: #f16b73; }
[data-dsh-rr-toast][data-kind="pending"] > [data-dsh-rr-icon] { color: #9ac9f0; animation: dsh-rr-spin .8s linear infinite; }
[data-dsh-rr-toast-dismiss] { appearance: none; flex: none; display: grid; place-items: center; width: 22px; height: 22px; margin: 0; padding: 3px; border: 0; border-radius: 5px; color: #aeb9c8; background: transparent; cursor: pointer; pointer-events: auto; }
[data-dsh-rr-toast-dismiss]:hover { color: #fff; background: rgb(255 255 255 / .08); }
[data-dsh-rr-toast-dismiss]:focus-visible { outline: 2px solid #8bcaff; outline-offset: 2px; }
[data-dsh-rr-toast][data-kind="error"] { border-color: rgb(255 105 105 / .5); }
@keyframes dsh-rr-toast-in { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
@keyframes dsh-rr-spin { to { transform: rotate(360deg); } }
@keyframes dsh-rr-open { from { opacity: 0; transform: translate(-50%, -50%) scale(.94); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@media (prefers-reduced-motion: reduce) { [data-dsh-rr-pie], [data-dsh-rr-toast], [data-dsh-rr-toast][data-kind="pending"] > [data-dsh-rr-icon] { animation: none; } [data-dsh-rr-action], [data-dsh-rr-label] { transition: none; } }
`;
function ensureRadialStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`style[data-plugin-css=${JSON.stringify(TAG_ID)}]`) !== null) return;
  const tag = document.createElement("style");
  tag.dataset.pluginCss = TAG_ID;
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// src/client/surface.ts
var EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])';
function isSessionConversationSurface(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest(EDITABLE) !== null) return false;
  if (target.closest("[data-composer-seat]") !== null) return false;
  return target.closest("[data-conversation-scroll], [data-phase], [data-chat-flow-key]") !== null;
}
function conversationTarget(target) {
  if (!(target instanceof Element)) return {};
  const row = target.closest("[data-chat-flow-key], [data-chat-turn]");
  if (row === null) return {};
  const raw = row.getAttribute("data-chat-turn");
  const turn = raw !== null && /^\d+$/.test(raw) ? Number(raw) : void 0;
  return {
    turn: turn !== void 0 && Number.isSafeInteger(turn) ? turn : void 0,
    nodeKey: row.dataset.chatFlowKey
  };
}

// src/client/Icons.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var PATHS = {
  "open-dir": "M3 8V5a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v2 M3 9h18l-3 11H3Z",
  "copy-cwd": "M9 9h11v11H9Z M15 6V3H3v12h3",
  "copy-session-id": "M9 3 7 21 M17 3 15 21 M4 9h17 M3 15h17",
  stop: "M8 4v8 M12 3v8 M16 5v7 M8 9V6a2 2 0 0 0-4 0v7l4 7h8l4-8a2 2 0 0 0-3-2l-1 2",
  fork: "M6 7v10 M6 11c10 0 12-2 12-4 M4 3h4v4H4Z M4 17h4v4H4Z M16 3h4v4h-4Z",
  export: "M12 3v12 M7 10l5 5 5-5 M4 15v6h16v-6",
  close: "M6 6l12 12 M18 6 6 18",
  check: "m5 12 4 4L19 6",
  error: "M12 8v5 M12 17h.01 M12 3 2 21h20Z",
  loading: "M21 12a9 9 0 1 1-9-9",
  menu: "M12 2v4 M12 18v4 M2 12h4 M18 12h4 M9 9h6v6H9Z",
  "check-circle": "m7.5 12 3 3 6-6",
  "error-circle": "M12 7v6 M12 17h.01"
};
function MenuIcon({ name, size = 24 }) {
  const circularStatus = name === "check-circle" || name === "error-circle";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.65",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false",
      "data-dsh-rr-icon": name,
      children: [
        circularStatus && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "10", fill: "currentColor", stroke: "none" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: PATHS[name], stroke: circularStatus ? "#fff" : void 0, strokeWidth: circularStatus ? 2 : void 0 })
      ]
    }
  );
}

// src/client/menu-layout.ts
var MENU_SIZE = 200;
var INNER_RATIO = 0.18;
var OUTER_RATIO = 0.47;
var LABEL_RATIO = 0.33;
var MENU_COUNT = 6;
function placeMenu(x, y, width, height) {
  const margin = 12;
  const detailClearance = 52;
  const size = Math.max(0, Math.min(MENU_SIZE, width - margin * 2, height - margin * 2 - detailClearance));
  const radius = size / 2;
  return {
    size,
    x: Math.max(radius + margin, Math.min(x, width - radius - margin)),
    y: Math.max(radius + margin, Math.min(y, height - radius - margin - detailClearance))
  };
}
function point(deg, radius) {
  const angle = deg * Math.PI / 180;
  return [50 + Math.sin(angle) * radius, 50 - Math.cos(angle) * radius];
}
function sectorClip(index) {
  const start = index * 360 / MENU_COUNT - 180 / MENU_COUNT;
  const points = [];
  for (const [radius, direction] of [[OUTER_RATIO * 100, 1], [INNER_RATIO * 100, -1]]) {
    for (let step = 0; step <= 20; step++) {
      const progress = direction === 1 ? step / 20 : 1 - step / 20;
      const [x, y] = point(start + progress * 360 / MENU_COUNT, radius);
      points.push(`${x.toFixed(3)}% ${y.toFixed(3)}%`);
    }
  }
  return `polygon(${points.join(",")})`;
}
function labelPosition(index) {
  const [x, y] = point(index * 360 / MENU_COUNT, LABEL_RATIO * 100);
  return { left: `${x}%`, top: `${y}%` };
}

// src/client/RadialMenu.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var MAIN_VIEW_RETAIN_SOURCE = "mainView";
var SECTORS = PIE_ACTION_IDS.map((id, index) => ({ id, clip: sectorClip(index), position: labelPosition(index) }));
function mainViewSessionId(list) {
  for (const [id, row] of Object.entries(list.byId)) {
    if ((row?.retainedBy?.[MAIN_VIEW_RETAIN_SOURCE] ?? 0) > 0) return id;
  }
  return void 0;
}
function readState(list) {
  const sessionId = mainViewSessionId(list);
  const row = sessionId === void 0 ? void 0 : list.byId[sessionId];
  return {
    sessionId,
    cwd: row?.cwd ?? "",
    running: row?.running ?? false
  };
}
function equalState(a, b) {
  return a.sessionId === b.sessionId && a.cwd === b.cwd && a.running === b.running;
}
function RadialMenu(props) {
  const state = props.useSessions(readState, equalState);
  const [open, setOpen] = (0, import_react.useState)(null);
  const [hover, setHover] = (0, import_react.useState)(null);
  const [feedback, setFeedback] = (0, import_react.useState)(null);
  const busyRef = (0, import_react.useRef)(false);
  const aliveRef = (0, import_react.useRef)(true);
  const focusBeforeOpen = (0, import_react.useRef)(null);
  const menuElement = (0, import_react.useRef)(null);
  const centerElement = (0, import_react.useRef)(null);
  const detailId = (0, import_react.useId)();
  const openRef = (0, import_react.useRef)(open);
  const stateRef = (0, import_react.useRef)(state);
  const depsRef = (0, import_react.useRef)(props.deps);
  openRef.current = open;
  stateRef.current = state;
  depsRef.current = props.deps;
  (0, import_react.useEffect)(() => {
    if (feedback === null || feedback.kind === "pending") return;
    const timer = window.setTimeout(() => setFeedback(null), feedback.kind === "error" ? 8e3 : 4500);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  const close = (0, import_react.useCallback)(() => {
    if (openRef.current === null) return;
    openRef.current = null;
    setOpen(null);
    setHover(null);
    if (focusBeforeOpen.current?.isConnected) focusBeforeOpen.current.focus({ preventScroll: true });
  }, []);
  const onPieClick = (event) => {
    const menu = openRef.current;
    if (menu === null) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.target !== event.currentTarget) return;
    close();
  };
  (0, import_react.useEffect)(() => {
    if (open !== null) centerElement.current?.focus({ preventScroll: true });
  }, [open]);
  (0, import_react.useEffect)(() => {
    if (openRef.current !== null && openRef.current.snapshot.sessionId !== state.sessionId) close();
  }, [state.sessionId, close]);
  (0, import_react.useEffect)(() => {
    ensureRadialStyles();
    aliveRef.current = true;
    const onContextMenu = (event) => {
      const pie = event.target instanceof Element ? event.target.closest("[data-dsh-rr-layer]") : null;
      if (pie !== null) {
        event.preventDefault();
        return;
      }
      if (!isSessionConversationSurface(event.target)) return;
      const current = stateRef.current;
      if (current.sessionId === void 0 || current.sessionId === "") return;
      event.preventDefault();
      event.stopPropagation();
      if (busyRef.current) return;
      const placed = placeMenu(event.clientX, event.clientY, window.innerWidth, window.innerHeight);
      const target = conversationTarget(event.target);
      let forkTarget = { kind: "no-turn" };
      if (target.turn !== void 0 || target.nodeKey !== void 0) {
        try {
          forkTarget = depsRef.current.resolveForkTarget?.(current.sessionId, target) ?? { kind: "unavailable" };
        } catch {
          forkTarget = { kind: "unavailable" };
        }
      }
      focusBeforeOpen.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const next = { ...placed, snapshot: { ...current, forkTarget } };
      openRef.current = next;
      setOpen(next);
      setHover(null);
    };
    const onKeyDown = (event) => {
      if (openRef.current === null) return;
      if (event.key === "Escape" || event.key === "Tab") {
        if (event.key === "Escape") event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        const items = Array.from(menuElement.current?.querySelectorAll('[role="menuitem"]') ?? []);
        if (items.length === 0) return;
        const index = items.indexOf(document.activeElement);
        const direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : index < 0 ? direction === 1 ? 0 : items.length - 1 : (index + direction + items.length) % items.length;
        items[next]?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", close);
    window.addEventListener("blur", close);
    document.addEventListener("scroll", close, true);
    return () => {
      aliveRef.current = false;
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("blur", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [close]);
  const onCatcherDown = (event) => {
    event.preventDefault();
    close();
  };
  const execute = async (id) => {
    const menu = openRef.current;
    if (menu === null || busyRef.current) return;
    if (menu.snapshot.sessionId !== stateRef.current.sessionId) {
      close();
      return;
    }
    const snapshot = { ...menu.snapshot, running: stateRef.current.running };
    if (!isActionEnabled(id, snapshot)) {
      setHover(PIE_ACTION_IDS.indexOf(id));
      return;
    }
    busyRef.current = true;
    const copy2 = dictionaryForDocument();
    setFeedback({ kind: "pending", text: withTurn(copy2[`${id}.pending`], snapshot) });
    close();
    try {
      await runAction(id, snapshot, depsRef.current);
      if (aliveRef.current) setFeedback({ kind: "success", text: withTurn(copy2[`${id}.success`], snapshot) });
    } catch (error) {
      if (aliveRef.current) setFeedback({ kind: "error", text: actionError(error, id, copy2) });
    } finally {
      busyRef.current = false;
    }
  };
  const copy = dictionaryForDocument();
  const menuState = { ...open?.snapshot ?? state, running: state.running };
  const description = hover === null ? copy.keys : hover === "cancel" ? copy.cancel : actionDescription(PIE_ACTION_IDS[hover], menuState, copy);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { "data-dsh-rr-layer": "", children: [
    open !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { "data-dsh-rr-catcher": "", onPointerDown: onCatcherDown }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
        "div",
        {
          ref: menuElement,
          "data-dsh-rr-pie": "",
          role: "menu",
          "aria-label": copy.menu,
          style: {
            left: open.x,
            top: open.y,
            ["--dsh-rr-size"]: `${String(open.size)}px`,
            ["--dsh-rr-hole"]: `${String(open.size * INNER_RATIO)}px`
          },
          onClick: onPieClick,
          onPointerDown: (event) => {
            event.stopPropagation();
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
              "button",
              {
                ref: centerElement,
                "data-dsh-rr-hole": "",
                onClick: close,
                type: "button",
                "aria-label": copy.cancel,
                onPointerEnter: () => setHover("cancel"),
                onFocus: () => setHover("cancel"),
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MenuIcon, { name: typeof hover === "number" ? PIE_ACTION_IDS[hover] : "close", size: 20 }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: menuState.forkTarget?.turn === void 0 ? copy.choose : withTurn(copy.turn, menuState) }),
                  /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "Esc" })
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { "data-dsh-rr-detail": "", id: detailId, "data-visible": typeof hover === "number" ? "" : void 0, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: description }) }),
            SECTORS.map(({ id, clip, position }, index) => {
              const enabled = isActionEnabled(id, menuState);
              return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                "button",
                {
                  type: "button",
                  role: "menuitem",
                  tabIndex: -1,
                  "data-dsh-rr-action": "",
                  "data-action": id,
                  "data-active": hover === index ? "" : void 0,
                  "data-disabled": enabled ? void 0 : "",
                  "aria-disabled": enabled ? void 0 : true,
                  title: copy[id],
                  "aria-label": copy[id],
                  "aria-describedby": detailId,
                  style: { clipPath: clip },
                  onPointerEnter: () => setHover(index),
                  onPointerLeave: () => setHover(null),
                  onFocus: () => setHover(index),
                  onClick: (event) => {
                    event.stopPropagation();
                    void execute(id);
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { "data-dsh-rr-label": "", style: position, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MenuIcon, { name: id, size: 22 }),
                    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-dsh-rr-text": "", children: copy[id] })
                  ] })
                },
                id
              );
            })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { role: "status", "aria-live": "polite", "aria-atomic": "true", children: feedback !== null && /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { "data-dsh-rr-toast": "", "data-kind": feedback.kind, children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MenuIcon, { name: feedback.kind === "success" ? "check-circle" : feedback.kind === "error" ? "error-circle" : "loading", size: 20 }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { "data-dsh-rr-toast-text": "", children: feedback.text }),
      feedback.kind !== "pending" && /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
        "button",
        {
          type: "button",
          "data-dsh-rr-toast-dismiss": "",
          "aria-label": copy.dismiss,
          onClick: () => setFeedback(null),
          children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(MenuIcon, { name: "close", size: 16 })
        }
      )
    ] }) })
  ] });
}

// src/shared.ts
var OPEN_DIR_ROUTE = "/dsh-round-rightclick/open-dir";
var OVERLAY_ID = "dsh-round-rightclick";
var MAX_BODY_BYTES = 64 * 1024;

// src/client/fork-target.ts
function resolveTurnFork(entries, turn, anchorSeq) {
  if (turn === void 0 && anchorSeq === void 0) return { kind: "no-turn" };
  if (turn !== void 0 && (!Number.isSafeInteger(turn) || turn < 0)) return { kind: "unavailable" };
  if (turn === void 0 && (anchorSeq === void 0 || !Number.isFinite(anchorSeq) || anchorSeq < 0 || anchorSeq > Number.MAX_SAFE_INTEGER)) {
    return { kind: "unavailable" };
  }
  for (const { type, event } of entries) {
    if (type !== "event" || event.type !== "turn/end") continue;
    const data = event.data;
    if (typeof data !== "object" || data === null || !("turn" in data)) continue;
    const endedTurn = data.turn;
    if (typeof endedTurn !== "number" || !Number.isSafeInteger(endedTurn) || endedTurn < 0) continue;
    if (!Number.isSafeInteger(event.seq) || event.seq < 0) continue;
    if (turn !== void 0 ? endedTurn === turn : event.seq >= anchorSeq) {
      return { kind: "ready", turn: endedTurn, atSeq: event.seq };
    }
  }
  return { kind: entries.length === 0 ? "unavailable" : "unfinished", turn };
}

// src/client/pie.ts
var TWO_PI = Math.PI * 2;
var DEFAULT_START_ANGLE = -Math.PI / 2;
function normalizeAngle(angle) {
  return (angle % TWO_PI + TWO_PI) % TWO_PI;
}
function sliceMidAngle(count, index, startAngle = DEFAULT_START_ANGLE) {
  if (count <= 0) throw new Error("sliceMidAngle: count must be positive");
  const width = TWO_PI / count;
  return startAngle + (index + 0.5) * width;
}
function sliceCssMidDegrees(count, index) {
  if (count <= 0) throw new Error("sliceCssMidDegrees: count must be positive");
  return (index + 0.5) * 360 / count;
}
function sliceCssSpanDegrees(count, index) {
  if (count <= 0) throw new Error("sliceCssSpanDegrees: count must be positive");
  const width = 360 / count;
  return { start: index * width, end: (index + 1) * width };
}
function hitTestPie(input) {
  const { center, pointer, innerRadius, count } = input;
  const startAngle = input.startAngle ?? DEFAULT_START_ANGLE;
  if (count <= 0) return { kind: "outside" };
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;
  const dist = Math.hypot(dx, dy);
  if (dist < innerRadius) return { kind: "cancel" };
  if (input.outerRadius !== void 0 && dist > input.outerRadius) return { kind: "outside" };
  const rel = normalizeAngle(Math.atan2(dy, dx) - startAngle);
  const width = TWO_PI / count;
  const index = Math.min(count - 1, Math.floor(rel / width));
  return { kind: "slice", index };
}

// src/client/index.ts
var inject = ["slots", "sessions", "locale"];
function defaultClipboardWrite(text) {
  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard === void 0) return Promise.reject(new Error("clipboard unavailable"));
  return clipboard.writeText(text);
}
function defaultSave(url, filename) {
  const doc = globalThis.document;
  if (doc === void 0) return;
  const anchor = doc.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}
async function postOpenDirectory(absDir) {
  const response = await fetch(new URL(OPEN_DIR_ROUTE, hostBase()), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path: absDir })
  });
  if (!response.ok) throw new Error(`open-dir failed: HTTP ${String(response.status)}`);
}
function createActionDeps(ctx) {
  return {
    openDirectory: postOpenDirectory,
    clipboardWrite: defaultClipboardWrite,
    cancel: async (sessionId) => {
      const scoped = ctx.sessions.scope(sessionId);
      const session = scoped === void 0 ? void 0 : ctx.sessions.sessionOf(scoped);
      if (session === void 0) throw new Error(`session "${sessionId}" is not scoped`);
      const result = await session.cancel();
      if (typeof result === "object" && result !== null && "ok" in result && result.ok === false) {
        const error = "error" in result ? result.error : void 0;
        throw Object.assign(new Error("Interrupt request rejected"), { cause: error });
      }
    },
    fork: async (sessionId, atSeq) => {
      if (atSeq === void 0 || !Number.isSafeInteger(atSeq) || atSeq < 0) throw new Error("A completed turn is required");
      const workspace = ctx.get?.("uiWorkspace");
      if (workspace === void 0 || typeof workspace.openSession !== "function") {
        throw new Error("Session navigation is unavailable");
      }
      const childId = await ctx.sessions.fork({ sessionId, atSeq, increaseTitle: true });
      workspace.openSession(childId);
    },
    resolveForkTarget: (sessionId, target) => {
      const conversation = ctx.get?.("uiConversation");
      const node = target.nodeKey === void 0 ? void 0 : conversation?.binding(sessionId).target("chat").getSnapshot()?.nodes.get(target.nodeKey);
      const location = node?.location;
      const turn = location?.kind === "turn" || location?.kind === "step" ? location.turn : void 0;
      if (turn?.status === "closed" && turn.end !== void 0 && Number.isSafeInteger(turn.end.seq) && turn.end.seq >= 0) {
        return { kind: "ready", turn: turn.turn, atSeq: turn.end.seq };
      }
      if (turn?.status === "open") return { kind: "unfinished", turn: turn.turn };
      const entries = ctx.sessions.binding?.(sessionId)?.eventSource?.getSnapshot().entries ?? [];
      if (target.nodeKey !== void 0 && node === void 0 && target.turn === void 0) return { kind: "unavailable" };
      return resolveTurnFork(entries, turn?.turn ?? target.turn, node?.anchorSeq);
    },
    exportLog: async (sessionId) => {
      const downloader = ctx.get?.("sessionLogDownload");
      if (downloader !== void 0) {
        await downloader.download(sessionId);
        return;
      }
      await downloadSessionExport(sessionId, {
        fetch: (input, init) => fetch(input, init),
        save: defaultSave,
        hostBase
      });
    }
  };
}
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-round-rightclick: dictionaries");
  const deps = createActionDeps(ctx);
  ctx.effect(() => {
    let disposeSlot;
    ctx.slots.inject("shell.overlay", () => {
      disposeSlot = ctx.slots.register({
        name: "shell.overlay",
        id: OVERLAY_ID,
        order: 40,
        inject: () => ({ deps })
      }, RadialMenu);
      return disposeSlot;
    });
    return () => {
      disposeSlot?.();
    };
  }, "dsh-round-rightclick: overlay");
}
return module.exports; } });

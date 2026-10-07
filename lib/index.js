// src/opener.ts
import path from "node:path";
import { spawn } from "node:child_process";
import { stat as fsStat } from "node:fs/promises";
function isAbsolutePath(filePath, platform) {
  if (platform === "win32") return path.win32.isAbsolute(filePath);
  return path.posix.isAbsolute(filePath);
}
function fileManagerCommand(platform, absDir) {
  switch (platform) {
    case "win32":
      return { command: "explorer.exe", args: [absDir] };
    case "darwin":
      return { command: "open", args: [absDir] };
    case "linux":
      return { command: "xdg-open", args: [absDir] };
    default:
      throw new Error(`unsupported platform: ${platform}`);
  }
}
async function checkOpenableDirectory(filePath, platform, statFn = fsStat) {
  if (typeof filePath !== "string" || filePath === "") {
    return { ok: false, reason: "empty" };
  }
  if (!isAbsolutePath(filePath, platform)) {
    return { ok: false, reason: "not-absolute" };
  }
  try {
    const info = await statFn(filePath);
    if (!info.isDirectory()) return { ok: false, reason: "not-directory" };
  } catch {
    return { ok: false, reason: "missing" };
  }
  return { ok: true, path: filePath };
}
function defaultSpawn(command, args) {
  const child = spawn(command, [...args], {
    detached: true,
    stdio: "ignore",
    windowsHide: false
  });
  child.unref();
}
async function openDirectoryInFileManager(platform, filePath, deps = {}) {
  const check = await checkOpenableDirectory(filePath, platform, deps.stat);
  if (!check.ok) return check;
  const mapped = fileManagerCommand(platform, check.path);
  const run = deps.spawn ?? defaultSpawn;
  run(mapped.command, mapped.args);
  return check;
}
function launchedThroughSsh(env = process.env) {
  return Boolean(env.SSH_CONNECTION && env.SSH_CONNECTION !== "" || env.SSH_TTY && env.SSH_TTY !== "");
}

// src/shared.ts
var OPEN_DIR_ROUTE = "/dsh-round-rightclick/open-dir";
var OVERLAY_ID = "dsh-round-rightclick";
var MAX_BODY_BYTES = 64 * 1024;

// src/index.ts
var name = "dsh-round-rightclick";
var inject = ["webServer"];
var internals = { current: {} };
function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}
async function readBoundedBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    size += buf.byteLength;
    if (size > MAX_BODY_BYTES) {
      req.resume();
      return null;
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks, size).toString("utf8");
}
function parseOpenBody(text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof body !== "object" || body === null) return null;
  const { path: filePath } = body;
  return typeof filePath === "string" ? { path: filePath } : null;
}
async function handleOpenDirRequest(req, res, opts = {}) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("allow", "POST");
    res.end();
    return;
  }
  const essence = String(req.headers["content-type"]).split(";", 1)[0]?.trim().toLowerCase();
  if (essence !== "application/json") {
    sendJson(res, 415, { code: "unsupported-media-type", message: "content-type must be application/json" });
    return;
  }
  const env = opts.env ?? process.env;
  if (launchedThroughSsh(env)) {
    sendJson(res, 403, { code: "ssh", message: "refusing to open a file manager over SSH" });
    return;
  }
  let text;
  try {
    text = await readBoundedBody(req);
  } catch {
    sendJson(res, 400, { code: "bad-request", message: "request body unreadable" });
    return;
  }
  if (text === null) {
    sendJson(res, 413, { code: "payload-too-large", message: "request body is too large" });
    return;
  }
  const parsed = parseOpenBody(text);
  if (parsed === null) {
    sendJson(res, 400, { code: "bad-request", message: "expected JSON { path: string }" });
    return;
  }
  const platform = opts.platform ?? process.platform;
  const result = await openDirectoryInFileManager(platform, parsed.path, {
    spawn: opts.spawn,
    stat: opts.stat
  });
  if (!result.ok) {
    sendJson(res, 400, { code: result.reason, message: `path rejected: ${result.reason}` });
    return;
  }
  sendJson(res, 200, { ok: true });
}
function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "exact",
    path: OPEN_DIR_ROUTE,
    handler: async (req, res) => {
      const connection = ctx.get?.("connection");
      const rejection = connection?.requestRejection(req);
      if (rejection !== void 0) {
        res.statusCode = rejection;
        res.end();
        return;
      }
      await handleOpenDirRequest(req, res, internals.current);
    }
  }), "dsh-round-rightclick: POST open-dir");
}
export {
  OPEN_DIR_ROUTE,
  OVERLAY_ID,
  apply,
  checkOpenableDirectory,
  fileManagerCommand,
  handleOpenDirRequest,
  inject,
  internals,
  isAbsolutePath,
  launchedThroughSsh,
  name,
  openDirectoryInFileManager
};

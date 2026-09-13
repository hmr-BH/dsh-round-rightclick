/**
 * 服务端入口：提供打开工作目录的 HTTP 接口。
 * 通过请求鉴权、请求体大小限制和目录校验后，才启动系统文件管理器。
 */

import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  launchedThroughSsh,
  openDirectoryInFileManager,
  type CommandRunner,
  type StatFn,
} from './opener.ts'
import { MAX_BODY_BYTES, OPEN_DIR_ROUTE } from './shared.ts'

export { OPEN_DIR_ROUTE, OVERLAY_ID } from './shared.ts'
export {
  checkOpenableDirectory,
  fileManagerCommand,
  isAbsolutePath,
  launchedThroughSsh,
  openDirectoryInFileManager,
} from './opener.ts'

/** 宿主加载插件时使用的名称。 */
export const name = 'dsh-round-rightclick'

/** 此插件需要宿主的 HTTP 服务。 */
export const inject = ['webServer']

/** 服务端操作的可选实现；测试可替换进程启动、文件状态和系统环境。 */
export interface HostInternals {
  readonly platform?: NodeJS.Platform
  readonly env?: NodeJS.ProcessEnv
  readonly spawn?: CommandRunner
  readonly stat?: StatFn
}

/** 测试使用的服务端依赖覆盖；正常运行时使用系统默认实现。 */
export const internals: { current: HostInternals } = { current: {} }

/** 注册 HTTP 接口所需的宿主服务和生命周期方法。 */
export interface HostContext {
  effect(fn: () => (() => void) | void, label?: string): unknown
  get?(key: string): unknown
  webServer: {
    register(route: {
      kind: 'exact' | 'prefix'
      path: string
      handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
    }): () => void
  }
}

interface ConnectionFence {
  requestRejection(request: { readonly headers: IncomingMessage['headers'] }): 401 | 403 | undefined
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(payload))
}

async function readBoundedBody(req: IncomingMessage): Promise<string | null> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    size += buf.byteLength
    if (size > MAX_BODY_BYTES) {
      req.resume()
      return null
    }
    chunks.push(buf)
  }
  return Buffer.concat(chunks, size).toString('utf8')
}

function parseOpenBody(text: string): { path: string } | null {
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof body !== 'object' || body === null) return null
  const { path: filePath } = body as { path?: unknown }
  return typeof filePath === 'string' ? { path: filePath } : null
}

/**
 * 校验并处理一次打开工作目录的 HTTP 请求。
 * @param req - 原始请求
 * @param res - 原始响应
 * @param opts - 平台、环境变量、进程启动和文件状态检查的可选实现
 * @returns 写入 HTTP 响应后完成的 Promise
 */
export async function handleOpenDirRequest(
  req: IncomingMessage,
  res: ServerResponse,
  opts: HostInternals = {},
): Promise<void> {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('allow', 'POST')
    res.end()
    return
  }
  const essence = String(req.headers['content-type']).split(';', 1)[0]?.trim().toLowerCase()
  if (essence !== 'application/json') {
    sendJson(res, 415, { code: 'unsupported-media-type', message: 'content-type must be application/json' })
    return
  }
  const env = opts.env ?? process.env
  if (launchedThroughSsh(env)) {
    sendJson(res, 403, { code: 'ssh', message: 'refusing to open a file manager over SSH' })
    return
  }
  let text: string | null
  try {
    text = await readBoundedBody(req)
  } catch {
    sendJson(res, 400, { code: 'bad-request', message: 'request body unreadable' })
    return
  }
  if (text === null) {
    sendJson(res, 413, { code: 'payload-too-large', message: 'request body is too large' })
    return
  }
  const parsed = parseOpenBody(text)
  if (parsed === null) {
    sendJson(res, 400, { code: 'bad-request', message: 'expected JSON { path: string }' })
    return
  }
  const platform = opts.platform ?? process.platform
  const result = await openDirectoryInFileManager(platform, parsed.path, {
    spawn: opts.spawn,
    stat: opts.stat,
  })
  if (!result.ok) {
    sendJson(res, 400, { code: result.reason, message: `path rejected: ${result.reason}` })
    return
  }
  sendJson(res, 200, { ok: true })
}

/**
 * 注册打开目录接口，先检查请求权限，并在插件卸载时移除接口。
 * @param ctx - 服务端插件上下文
 * @returns 无返回值；接口由宿主跟随插件生命周期管理
 */
export function apply(ctx: HostContext): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: OPEN_DIR_ROUTE,
    handler: async (req, res) => {
      const connection = ctx.get?.('connection') as ConnectionFence | undefined
      const rejection = connection?.requestRejection(req)
      if (rejection !== undefined) {
        res.statusCode = rejection
        res.end()
        return
      }
      await handleOpenDirRequest(req, res, internals.current)
    },
  }), 'dsh-round-rightclick: POST open-dir')
}

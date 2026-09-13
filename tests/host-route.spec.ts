import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { apply, internals, OPEN_DIR_ROUTE, type HostContext } from '../src/index.ts'

const spawned: { command: string; args: readonly string[] }[] = []
let temp: string | undefined
let rejection: 401 | 403 | undefined

afterEach(async () => {
  spawned.length = 0
  rejection = undefined
  internals.current = {}
  if (temp !== undefined) {
    await rm(temp, { recursive: true, force: true })
    temp = undefined
  }
})

interface RecordedRoute {
  path: string
  handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
}

function boot(): { routes: RecordedRoute[]; dispose: () => void } {
  const routes: RecordedRoute[] = []
  const disposers: Array<() => void> = []
  const ctx: HostContext = {
    effect(fn) {
      const d = fn()
      if (typeof d === 'function') disposers.push(d)
    },
    get(key) {
      if (key === 'connection') {
        return { requestRejection: () => rejection }
      }
      return undefined
    },
    webServer: {
      register(route) {
        routes.push(route)
        return () => {
          const i = routes.indexOf(route)
          if (i >= 0) routes.splice(i, 1)
        }
      },
    },
  }
  apply(ctx)
  internals.current = {
    spawn: (command, args) => { spawned.push({ command, args }) },
  }
  return {
    routes,
    dispose: () => { for (const d of disposers) d() },
  }
}

function mockReq(opts: {
  method?: string
  contentType?: string
  body?: string
}): IncomingMessage {
  const body = opts.body ?? ''
  const stream = Readable.from([Buffer.from(body)]) as IncomingMessage
  stream.method = opts.method ?? 'POST'
  stream.headers = { 'content-type': opts.contentType ?? 'application/json' }
  return stream
}

function mockRes(): ServerResponse & { body: string } {
  let body = ''
  const headers: Record<string, string> = {}
  return {
    statusCode: 0,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value
      return this as ServerResponse
    },
    end(chunk?: unknown) {
      if (typeof chunk === 'string') body = chunk
      else if (Buffer.isBuffer(chunk)) body = chunk.toString('utf8')
      return this as ServerResponse
    },
    get body() { return body },
  } as ServerResponse & { body: string }
}

describe('host apply open-dir route', () => {
  it('registers the named route and fiber-style dispose removes it', () => {
    const { routes, dispose } = boot()
    expect(routes).toHaveLength(1)
    expect(routes[0]?.path).toBe(OPEN_DIR_ROUTE)
    dispose()
    expect(routes).toHaveLength(0)
  })

  it('opens an existing temp directory through the opener mapping', async () => {
    temp = await mkdtemp(path.join(tmpdir(), 'dsh-rr-host-'))
    const { routes } = boot()
    const res = mockRes()
    await routes[0]!.handler(mockReq({ body: JSON.stringify({ path: temp }) }), res)
    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual({ ok: true })
    expect(spawned).toHaveLength(1)
    expect(spawned[0]?.args).toEqual([temp])
  })

  it('rejects invalid JSON and non-absolute paths without spawn', async () => {
    const { routes } = boot()
    const badJson = mockRes()
    await routes[0]!.handler(mockReq({ body: '{not json' }), badJson)
    expect(badJson.statusCode).toBe(400)
    expect(spawned).toHaveLength(0)

    const relative = mockRes()
    await routes[0]!.handler(mockReq({ body: JSON.stringify({ path: 'relative/dir' }) }), relative)
    expect(relative.statusCode).toBe(400)
    expect(JSON.parse(relative.body).code).toBe('not-absolute')
    expect(spawned).toHaveLength(0)
  })

  it('does not spawn a file as if it were a directory', async () => {
    temp = await mkdtemp(path.join(tmpdir(), 'dsh-rr-host-'))
    const file = path.join(temp, 'a.txt')
    await writeFile(file, 'x')
    const { routes } = boot()
    const res = mockRes()
    await routes[0]!.handler(mockReq({ body: JSON.stringify({ path: file }) }), res)
    expect(res.statusCode).toBe(400)
    expect(JSON.parse(res.body).code).toBe('not-directory')
    expect(spawned).toHaveLength(0)
  })

  it('honors the connection trust fence', async () => {
    rejection = 401
    const { routes } = boot()
    const res = mockRes()
    await routes[0]!.handler(mockReq({ body: JSON.stringify({ path: '/x' }) }), res)
    expect(res.statusCode).toBe(401)
    expect(spawned).toHaveLength(0)
  })

  it('refuses to spawn when the host is an SSH session', async () => {
    temp = await mkdtemp(path.join(tmpdir(), 'dsh-rr-host-'))
    const { routes } = boot()
    internals.current = {
      ...internals.current,
      env: { SSH_CONNECTION: '1 2 3 4' },
    }
    const res = mockRes()
    await routes[0]!.handler(mockReq({ body: JSON.stringify({ path: temp }) }), res)
    expect(res.statusCode).toBe(403)
    expect(JSON.parse(res.body).code).toBe('ssh')
    expect(spawned).toHaveLength(0)
  })
})

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  checkOpenableDirectory,
  fileManagerCommand,
  openDirectoryInFileManager,
} from '../src/opener.ts'

const spawned: { command: string; args: readonly string[] }[] = []
const spawn = (command: string, args: readonly string[]): void => {
  spawned.push({ command, args })
}

let temp: string | undefined

afterEach(async () => {
  spawned.length = 0
  if (temp !== undefined) {
    await rm(temp, { recursive: true, force: true })
    temp = undefined
  }
})

describe('fileManagerCommand', () => {
  it('maps win32 / darwin / linux to Explorer, open, xdg-open', () => {
    const dir = path.win32.join('C:\\', 'work', 'proj')
    expect(fileManagerCommand('win32', dir)).toEqual({ command: 'explorer.exe', args: [dir] })
    expect(fileManagerCommand('darwin', '/Users/me/proj')).toEqual({ command: 'open', args: ['/Users/me/proj'] })
    expect(fileManagerCommand('linux', '/home/me/proj')).toEqual({ command: 'xdg-open', args: ['/home/me/proj'] })
  })

  it('rejects unknown platforms before any command is produced', () => {
    expect(() => fileManagerCommand('freebsd' as NodeJS.Platform, '/tmp')).toThrow(/unsupported platform/)
  })
})

describe('openDirectoryInFileManager', () => {
  it('spawns the mapped command for an existing absolute directory', async () => {
    temp = await mkdtemp(path.join(tmpdir(), 'dsh-rr-opener-'))
    const result = await openDirectoryInFileManager(process.platform, temp, { spawn })
    expect(result).toEqual({ ok: true, path: temp })
    expect(spawned).toHaveLength(1)
    const mapped = fileManagerCommand(process.platform, temp)
    expect(spawned[0]).toEqual(mapped)
  })

  it('rejects missing, relative, empty, and non-directory paths before spawn', async () => {
    temp = await mkdtemp(path.join(tmpdir(), 'dsh-rr-opener-'))
    const file = path.join(temp, 'note.txt')
    await writeFile(file, 'x')

    const missing = await openDirectoryInFileManager(process.platform, path.join(temp, 'nope'), { spawn })
    expect(missing).toEqual({ ok: false, reason: 'missing' })

    const relative = await openDirectoryInFileManager(process.platform, 'relative/dir', { spawn })
    expect(relative).toEqual({ ok: false, reason: 'not-absolute' })

    const empty = await openDirectoryInFileManager(process.platform, '', { spawn })
    expect(empty).toEqual({ ok: false, reason: 'empty' })

    const notDir = await openDirectoryInFileManager(process.platform, file, { spawn })
    expect(notDir).toEqual({ ok: false, reason: 'not-directory' })

    expect(spawned).toHaveLength(0)
  })

  it('checkOpenableDirectory uses per-platform absolute rules', async () => {
    const posix = await checkOpenableDirectory('C:\\work', 'linux', async () => ({ isDirectory: () => true }))
    expect(posix.ok).toBe(false)
    if (!posix.ok) expect(posix.reason).toBe('not-absolute')

    const win = await checkOpenableDirectory('relative\\proj', 'win32', async () => ({ isDirectory: () => true }))
    expect(win.ok).toBe(false)
    if (!win.ok) expect(win.reason).toBe('not-absolute')
  })
})

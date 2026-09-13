/**
 * 跨平台文件管理器命令映射与目录校验。
 * 文件状态检查和进程启动可替换，测试时无需打开系统窗口。
 */

import path from 'node:path'
import { spawn } from 'node:child_process'
import { stat as fsStat } from 'node:fs/promises'
import type { Stats } from 'node:fs'

/** 使用命令名和独立参数启动外部程序的函数。 */
export type CommandRunner = (command: string, args: readonly string[]) => void

/** 检查路径是否为目录的异步函数。 */
export type StatFn = (filePath: string) => Promise<Pick<Stats, 'isDirectory'>>

/** 校验失败原因。 */
export type PathRejectReason = 'empty' | 'not-absolute' | 'missing' | 'not-directory'

/** 打开目录的校验结果。 */
export type DirectoryCheck =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly reason: PathRejectReason }

/**
 * 按平台判断绝对路径。测试传入 platform，避免 Windows 主机把 POSIX 路径判成相对。
 * @param filePath - 候选路径
 * @param platform - 目标平台
 * @returns 路径符合该平台的绝对路径格式时为 true
 */
export function isAbsolutePath(filePath: string, platform: NodeJS.Platform): boolean {
  if (platform === 'win32') return path.win32.isAbsolute(filePath)
  return path.posix.isAbsolute(filePath)
}

/**
 * 根据系统类型选择文件管理器，并将目录作为独立参数传入。
 * Windows 使用 explorer.exe，macOS 使用 open，Linux 使用 xdg-open。
 * @param platform - 目标平台
 * @param absDir - 已确认为绝对路径的目录
 * @returns 可执行文件名和参数数组
 */
export function fileManagerCommand(
  platform: NodeJS.Platform,
  absDir: string,
): { readonly command: string; readonly args: readonly string[] } {
  switch (platform) {
    case 'win32':
      return { command: 'explorer.exe', args: [absDir] }
    case 'darwin':
      return { command: 'open', args: [absDir] }
    case 'linux':
      return { command: 'xdg-open', args: [absDir] }
    default:
      throw new Error(`unsupported platform: ${platform}`)
  }
}

/**
 * 校验路径：非空、当前平台绝对路径、存在且为目录。
 * @param filePath - 请求里的路径
 * @param platform - 用于绝对路径规则
 * @param statFn - 文件状态检查函数
 * @returns 通过校验的路径，或用于提示用户的失败原因
 */
export async function checkOpenableDirectory(
  filePath: unknown,
  platform: NodeJS.Platform,
  statFn: StatFn = fsStat,
): Promise<DirectoryCheck> {
  if (typeof filePath !== 'string' || filePath === '') {
    return { ok: false, reason: 'empty' }
  }
  if (!isAbsolutePath(filePath, platform)) {
    return { ok: false, reason: 'not-absolute' }
  }
  try {
    const info = await statFn(filePath)
    if (!info.isDirectory()) return { ok: false, reason: 'not-directory' }
  } catch {
    return { ok: false, reason: 'missing' }
  }
  return { ok: true, path: filePath }
}

/**
 * 启动独立的文件管理器进程，避免其生命周期阻塞插件。
 * @param command - 可执行文件
 * @param args - 参数
 * @returns 无返回值；文件管理器窗口独立运行
 */
export function defaultSpawn(command: string, args: readonly string[]): void {
  const child = spawn(command, [...args], {
    detached: true,
    stdio: 'ignore',
    windowsHide: false,
  })
  child.unref()
}

/**
 * 确认路径是有效目录后打开文件管理器。
 * @param platform - 目标平台
 * @param filePath - 请求路径
 * @param deps - 文件状态检查和进程启动函数的可选实现
 * @returns 路径校验结果；成功时已发出打开目录的请求
 */
export async function openDirectoryInFileManager(
  platform: NodeJS.Platform,
  filePath: unknown,
  deps: { readonly stat?: StatFn; readonly spawn?: CommandRunner } = {},
): Promise<DirectoryCheck> {
  const check = await checkOpenableDirectory(filePath, platform, deps.stat)
  if (!check.ok) return check
  const mapped = fileManagerCommand(platform, check.path)
  const run = deps.spawn ?? defaultSpawn
  run(mapped.command, mapped.args)
  return check
}

/**
 * 判断是否通过 SSH 启动，避免把文件管理器打开在远端服务器桌面上。
 * @param env - 进程环境
 * @returns 存在 SSH 会话标记时为 true
 */
export function launchedThroughSsh(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean((env.SSH_CONNECTION && env.SSH_CONNECTION !== '')
    || (env.SSH_TTY && env.SSH_TTY !== ''))
}

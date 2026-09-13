/** 打开工作目录的 HTTP 接口路径。 */
export const OPEN_DIR_ROUTE = '/dsh-round-rightclick/open-dir'

/** 打开目录请求体。 */
export interface OpenDirPayload {
  readonly path: string
}

/** 菜单浮层的注册标识，用于防止重复注册及卸载时定位。 */
export const OVERLAY_ID = 'dsh-round-rightclick'

/** 打开目录请求的大小上限为 64 KiB，避免无界读取请求体。 */
export const MAX_BODY_BYTES = 64 * 1024

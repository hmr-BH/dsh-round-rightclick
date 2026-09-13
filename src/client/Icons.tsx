import type { PieActionId } from './actions.ts'

/** 统一线宽的菜单及状态图标名称。 */
export type IconName = PieActionId | 'close' | 'check' | 'error' | 'loading' | 'menu' | 'check-circle' | 'error-circle'

const PATHS: Record<IconName, string> = {
  'open-dir': 'M3 8V5a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v2 M3 9h18l-3 11H3Z',
  'copy-cwd': 'M9 9h11v11H9Z M15 6V3H3v12h3',
  'copy-session-id': 'M9 3 7 21 M17 3 15 21 M4 9h17 M3 15h17',
  stop: 'M8 4v8 M12 3v8 M16 5v7 M8 9V6a2 2 0 0 0-4 0v7l4 7h8l4-8a2 2 0 0 0-3-2l-1 2',
  fork: 'M6 7v10 M6 11c10 0 12-2 12-4 M4 3h4v4H4Z M4 17h4v4H4Z M16 3h4v4h-4Z',
  export: 'M12 3v12 M7 10l5 5 5-5 M4 15v6h16v-6',
  close: 'M6 6l12 12 M18 6 6 18',
  check: 'm5 12 4 4L19 6',
  error: 'M12 8v5 M12 17h.01 M12 3 2 21h20Z',
  loading: 'M21 12a9 9 0 1 1-9-9',
  menu: 'M12 2v4 M12 18v4 M2 12h4 M18 12h4 M9 9h6v6H9Z',
  'check-circle': 'm7.5 12 3 3 6-6',
  'error-circle': 'M12 7v6 M12 17h.01',
}

/**
 * 绘制与字体无关的线性 SVG 图标。
 * @param props - 图标名称和可选尺寸
 * @returns 装饰性图标；可访问名称由外层控件提供
 */
export function MenuIcon({ name, size = 24 }: { readonly name: IconName; readonly size?: number }): React.JSX.Element {
  const circularStatus = name === 'check-circle' || name === 'error-circle'
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
    data-dsh-rr-icon={name}>
    {circularStatus && <circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" />}
    <path d={PATHS[name]} stroke={circularStatus ? '#fff' : undefined} strokeWidth={circularStatus ? 2 : undefined} />
  </svg>
}

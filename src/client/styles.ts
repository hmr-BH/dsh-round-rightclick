const TAG_ID = 'dsh-round-rightclick/radial'

const CSS = `
[data-dsh-rr-layer] { --dsw-corner-shape: round; position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; font-family: var(--dsw-font-family, system-ui, sans-serif); }
[data-dsh-rr-catcher] { position: fixed; inset: 0; pointer-events: auto; }
/* 宿主主题会给所有元素设置超椭圆，圆盘及其同心圆必须明确使用标准圆弧。 */
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
`

/**
 * 将菜单样式添加到当前文档，重复调用不会插入多份样式。
 * @returns 无返回值；没有 document 时不执行操作
 */
export function ensureRadialStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector(`style[data-plugin-css=${JSON.stringify(TAG_ID)}]`) !== null) return
  const tag = document.createElement('style')
  tag.dataset.pluginCss = TAG_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
}

import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// 使用已安装的宿主切分实现，只把创建会话和工作区写入替换成内存记录，避免触碰用户会话。
const dshRoot = process.argv[2]
if (!dshRoot) throw new Error('请提供已安装 @deepseek-ai/dsh 的绝对目录')
const controllerPath = resolve(dshRoot, 'node_modules/@deepseek-ai/dsh-api-session-controller/lib/types/commands.js')
const { SessionCommandController } = await import(pathToFileURL(controllerPath).href)
const localRequire = createRequire(new URL('../package.json', import.meta.url))
let client
const bundle = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
new Function('window', bundle)({ __ModuleLoader__: { load: handoff => { client = handoff.factory(localRequire) } } })

const entries = [
  ['turn/start', { turn: 1 }],
  ['user/message', { content: '第一轮提问' }],
  ['assistant/message', { content: '第一轮回复' }],
  ['turn/end', { turn: 1 }],
  ['turn/start', { turn: 2 }],
  ['user/message', { content: '第二轮提问' }],
  ['assistant/message', { content: '第二轮回复' }],
  ['turn/end', { turn: 2 }],
  ['turn/start', { turn: 3 }],
  ['user/message', { content: '尚未完成的第三轮' }],
].map(([type, data], seq) => ({ type: 'event', event: { type, data, seq, time: seq } }))
const events = entries.map(entry => entry.event)
const originalEvents = structuredClone(events)
const creations = []
const opened = []
const attached = []
const forkRequests = []
const workspace = { id: 'fixture-workspace', sessionIds: ['fixture-source'], attachSession: async id => { attached.push(id) } }
const controller = new SessionCommandController({
  sessionQuery: { observeSession: async id => {
    assert.equal(id, 'fixture-source')
    return { header: { id, cwd: 'fixture-workspace' }, events, [Symbol.dispose]() {} }
  } },
  workspaceRegistry: { list: () => [workspace] },
  agentDefaultModel: { currentSelection: () => ({ provider: 'fixture', model: 'fixture' }) },
  agents: { create: async options => { creations.push(options) } },
}, {
  presetForObservation: () => 'fixture',
  composeAgent: async () => ({ setup() {}, agentPreset: 'fixture' }),
}, 'fixture-workspace')

const deps = client.createActionDeps({
  sessions: {
    fork: async options => {
      forkRequests.push(options)
      const child = await controller.fork(options)
      return child.sessionId
    },
    open: id => { opened.push(id) },
    binding: () => ({ eventSource: { getSnapshot: () => ({ entries }) } }),
  },
  get: key => key === 'uiConversation' ? {
    binding: () => ({ target: () => ({ getSnapshot: () => ({ nodes: {
      get: key => key === 'first-question' ? { anchorSeq: 1, location: { kind: 'session' } } : undefined,
    } }) }) }),
  } : undefined,
})

for (const [target, expectedTurn, expectedCount] of [
  [{ turn: 1 }, 1, 4],
  [{ nodeKey: 'first-question' }, 1, 4],
  [{ turn: 2 }, 2, 8],
]) {
  const forkTarget = deps.resolveForkTarget('fixture-source', target)
  assert.equal(forkTarget.kind, 'ready')
  assert.equal(forkTarget.turn, expectedTurn)
  await client.runAction('fork', { sessionId: 'fixture-source', cwd: 'fixture-workspace', running: false, forkTarget }, deps)
  const created = creations.at(-1)
  assert.deepEqual(created.seed, events.slice(0, expectedCount))
  assert.equal(created.inheritedEventCount, expectedCount)
  assert.equal(created.meta.parentSession, 'fixture-source')
  assert.equal(opened.at(-1), created.sessionId)
  assert.equal(attached.at(-1), created.sessionId)
  assert.equal(forkRequests.at(-1).atSeq, expectedCount - 1)
  assert.equal(forkRequests.at(-1).increaseTitle, true)
  console.log(`通过：第 ${expectedTurn} 轮${target.nodeKey ? '提问' : '回复'}分叉，保留 ${expectedCount} 条事件，随后打开子会话。`)
}

for (const target of [{ turn: 3 }, {}, { nodeKey: 'missing' }]) {
  const forkTarget = deps.resolveForkTarget('fixture-source', target)
  assert.notEqual(forkTarget.kind, 'ready')
  await client.runAction('fork', { sessionId: 'fixture-source', cwd: '', running: false, forkTarget }, deps)
}
assert.equal(creations.length, 3)
assert.deepEqual(events, originalEvents)
console.log('通过：未完成、空白和未加载位置均未创建会话；源事件保持不变。')

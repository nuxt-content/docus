import { spawn, type ChildProcess } from 'node:child_process'
import { rm } from 'node:fs/promises'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'
import { afterAll, expect, it } from 'vitest'

const playgroundDir = fileURLToPath(new URL('../../playground', import.meta.url))

let dev: ChildProcess | undefined
let output = ''

afterAll(() => {
  // `detached` puts Nuxt and its child in one process group.
  if (dev?.pid) process.kill(-dev.pid, 'SIGKILL')
})

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer().listen(0, () => {
      const { port } = server.address() as { port: number }
      server.close(() => resolve(port))
    }).on('error', reject)
  })
}

function waitForOutput(pattern: RegExp, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No ${pattern} in dev output after ${timeout} ms:\n${output}`)), timeout)
    const check = () => {
      if (!pattern.test(output)) return
      clearTimeout(timer)
      dev!.stdout!.off('data', check)
      resolve()
    }
    dev!.stdout!.on('data', check)
    check()
  })
}

// Vitest's variables put Nuxt and Nitro in test mode, which hides build logs and changes worker shutdown.
const devEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'NODE_ENV' && key !== 'TEST' && !key.startsWith('VITEST')))

const nitroBuilds = () => output.match(/Nitro server built/g)?.length ?? 0

it('answers the first request after a cold `nuxt dev`', async () => {
  // A cached `.nuxt` would hide the cold start where this broke.
  await rm(`${playgroundDir}/.nuxt`, { recursive: true, force: true })
  await rm(`${playgroundDir}/node_modules/.cache`, { recursive: true, force: true })

  const port = await freePort()
  dev = spawn('pnpm', ['exec', 'nuxt', 'dev', '--extends', '../layer', '--port', String(port)], {
    cwd: playgroundDir,
    detached: true,
    env: { ...devEnv, TMPDIR: '/tmp', NO_COLOR: '1' },
  })
  dev.stdout!.setEncoding('utf8').on('data', (chunk: string) => output += chunk)
  dev.stderr!.setEncoding('utf8').on('data', (chunk: string) => output += chunk)

  await waitForOutput(/Ready in/, 120_000)
  // The request lands while a module may still be rebuilding Nitro, as a developer opening the page would.
  await new Promise(resolve => setTimeout(resolve, 3000))

  const status = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(30_000) })
    .then(res => res.status, (error: Error) => error.name)
  // Leave time for a late rebuild to show up.
  await new Promise(resolve => setTimeout(resolve, 10_000))

  // Each rebuild replaces the dev worker and drops the requests it was serving.
  expect.soft(nitroBuilds(), 'Nitro dev server builds').toBe(1)
  expect(status, 'first request').toBe(200)
})

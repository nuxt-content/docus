import { resolve } from 'node:path'
import { defineCommand, runMain } from 'citty'
import type { CLIOptions } from './types'

export function createCLI(opts: CLIOptions) {
  const main = defineCommand({
    meta: {
      name: opts.name,
      description: opts.description,
    },
    args: {
      dir: {
        type: 'positional',
        description: 'Project directory',
        required: false,
        default: 'docs',
      },
      template: {
        type: 'string',
        alias: 't',
        description: 'Template to use (default, i18n)',
        required: false,
        default: 'default',
      },
    },
    async setup(context) {
      const dir = resolve(context.args.dir as string)
      const template = context.args.template as 'i18n' | 'default'

      if (!['i18n', 'default'].includes(template)) {
        throw new Error('Invalid template')
      }

      const { runCommand } = await import('@nuxt/cli')
      await runCommand('init', [dir, '-t', `gh:nuxt-content/docus/.starters/${template}`])
    },
  })

  return {
    runMain: () => runMain(main),
  }
}

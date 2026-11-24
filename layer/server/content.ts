import { createNuxtContent } from '@nuxt/content/content'
import type { JsonSchema } from 'comark-content'
import fs from 'comark-content/sources/fs'
import json from 'comark-content/plugins/json'
import yaml from 'comark-content/plugins/yaml'
import { z } from 'zod'
import { docsSchema } from '../utils/schema'

// Decided by the `config` module on build. This file runs again on the server, where `content/` may not exist.
const exclude: string[] = JSON.parse(process.env.DOCUS_CONTENT_EXCLUDE || '[]')

export const content = createNuxtContent({
  mode: 'server-only',
  name: 'docs',
  source: fs('content', {
    cwd: import.meta.rootDir,
    exclude,
    schema: z.toJSONSchema(docsSchema) as JsonSchema,
  }),
  plugins: [yaml(), json()],
})

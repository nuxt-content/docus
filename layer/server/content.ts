import { createNuxtContent } from '@nuxt/content/content'
import type { JsonSchema } from 'comark-content'
import fs from 'comark-content/sources/fs'
import json from 'comark-content/plugins/json'
import yaml from 'comark-content/plugins/yaml'
import { z } from 'zod'
import { docsSchema } from '../utils/schema'
import type { ContentSourceOptions } from '../utils/pages'

// Decided by the `config` module on build. This file runs again on the server, where `content/` may not exist.
const sources: ContentSourceOptions[] = JSON.parse(process.env.DOCUS_CONTENT_SOURCES || '[]')
const schema = z.toJSONSchema(docsSchema) as JsonSchema

export const content = createNuxtContent({
  mode: 'server-only',
  // One source per locale, so the browser search loads only the current one
  sources: Object.fromEntries(sources.map(source => [source.name, fs(source.dir ? `content/${source.dir}` : 'content', {
    cwd: import.meta.rootDir,
    prefix: source.prefix,
    exclude: source.exclude,
    schema,
  })])),
  plugins: [yaml(), json()],
})

import { defu } from 'defu'

// Copy of `@nuxt/content/preview` from Content v3, which Content v4 doesn't ship.

type InputValue = Record<string, unknown>

type ConfigInputsTypes = 'default' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file' | 'media' | 'component' | 'icon' | 'textarea'

type PreviewFieldData = {
  title?: string
  description?: string
  default?: unknown
  required?: unknown
  type?: ConfigInputsTypes
  icon?: string
  fields?: { [key: string]: InputValue }
  [key: string]: unknown
}

const inputTypes: Record<ConfigInputsTypes, string> = {
  default: 'string',
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  array: 'array',
  object: 'object',
  file: 'string',
  media: 'string',
  component: 'string',
  icon: 'string',
  textarea: 'string',
}

/**
 * Helper to build preview compatible configuration schema.
 */
export function field(schema: PreviewFieldData): InputValue {
  if (!schema.type) {
    throw new Error(`Missing type in schema ${JSON.stringify(schema)}`)
  }

  const base = { type: inputTypes[schema.type], tags: [`@previewInput ${schema.type === 'default' ? 'string' : schema.type}`] }
  const result = defu(base, schema) as PreviewFieldData & { tags: string[] }

  if (result.icon) {
    result.tags.push(`@previewIcon ${result.icon}`)
    delete result.icon
  }
  return {
    $schema: result,
  }
}

export function group(schema: PreviewFieldData): InputValue {
  const result = { ...schema }

  if (result.icon) {
    result.tags = [`@previewIcon ${result.icon}`]
    delete result.icon
  }

  const fields: Record<string, InputValue> = {}
  if (result.fields) {
    for (const key of Object.keys(result.fields)) {
      fields[key] = result.fields[key]!
    }
    delete result.fields
  }

  return {
    $schema: result,
    ...fields,
  }
}

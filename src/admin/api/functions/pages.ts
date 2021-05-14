import { promises as fs } from 'fs'
import { join, extname } from 'path'
import matter from 'gray-matter'
import { createError, Middleware, useBody } from 'h3'
import dirTree from 'directory-tree'
import { normalizeFiles, r } from '../utils'
import { useParser } from '../../../core'

interface Body {
  data: any
  content: string
}

export default <Middleware>async function pagesHandler(req) {
  const url = req.url
  const parser = useParser()

  if (req.method === 'GET') {
    // List all pages
    if (url === '/') {
      const tree = dirTree(r('pages'))
      return normalizeFiles(tree.children, r('pages'))
    }
    // Read a single page
    try {
      const path = join(r('pages'), url)
      const file = await fs.readFile(path, 'utf-8')
      const { content, data } = matter(file)

      const parsed = await parser.parse(path, content)
      return {
        ...parsed,
        path: path.replace(r('pages'), ''),
        extension: extname(path),
        data,
        raw: file,
        content
      }
    } catch (err) {
      console.error(err)
      return createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
  }

  // Update changes
  if (req.method === 'PUT') {
    const body = await useBody<Body>(req)
    const { data, content } = body

    if (!content) {
      return createError({
        statusCode: 400,
        statusMessage: 'content key is required'
      })
    }

    const path = join(r('pages'), url)

    try {
      // @ts-ignore
      await fs.stat(path, 'utf-8')

      const file = data ? matter.stringify(content, data) : content

      await fs.writeFile(path, file)

      return { ok: true }
    } catch (err) {
      return createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
  }

  return createError({
    statusCode: 400,
    statusMessage: 'Bad Request'
  })
}

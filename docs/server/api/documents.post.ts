/**
 * POST /api/documents/process
 * Processes uploaded documents (PDF generation, DOCX/XLSX parsing).
 *
 * Query param: ?type=pdf|docx|xlsx
 * Body (for docx/xlsx): raw file buffer
 * Body (for pdf): JSON { title, content }
 */
import { createPdf, extractDocxText, convertDocxToHtml, readXlsx } from '../utils/documents'

export default defineEventHandler(async (event) => {
  const type = getQuery(event).type as string

  if (type === 'pdf') {
    const body = await readBody<{ title?: string; content?: string }>(event)
    const title = body?.title || 'Document'
    const content = body?.content || ''
    const pdfBytes = await createPdf(title, content)
    setHeader(event, 'Content-Type', 'application/pdf')
    setHeader(event, 'Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.pdf"`)
    return Buffer.from(pdfBytes)
  }

  if (type === 'docx' || type === 'docx-html') {
    const buffer = Buffer.from(await readRawBody(event) || '')
    if (type === 'docx-html') {
      const html = await convertDocxToHtml(buffer)
      return { html }
    }
    const text = await extractDocxText(buffer)
    return { text }
  }

  if (type === 'xlsx') {
    const buffer = Buffer.from(await readRawBody(event) || '')
    const sheets = await readXlsx(buffer)
    return { sheets }
  }

  throw createError({ statusCode: 400, message: 'Invalid document type. Use ?type=pdf|docx|docx-html|xlsx' })
})

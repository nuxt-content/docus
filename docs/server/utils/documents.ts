/**
 * Document processing utilities
 * Supports PDF, DOCX, XLSX file reading and manipulation
 */

// ─── PDF Utilities ────────────────────────────────────────────────────────────

/**
 * Create a simple PDF from text content using pdf-lib
 */
export async function createPdf(title: string, content: string): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const page = doc.addPage()
  const { width, height } = page.getSize()
  const fontSize = 12

  page.drawText(title, {
    x: 50,
    y: height - 60,
    size: 18,
    font,
    color: rgb(0, 0, 0),
  })

  const lines = content.split('\n')
  let currentPage = page
  let y = height - 100
  for (const line of lines) {
    if (y < 50) {
      currentPage = doc.addPage()
      y = currentPage.getSize().height - 50
    }
    currentPage.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
    y -= fontSize + 4
  }

  return doc.save()
}

// ─── DOCX Utilities ───────────────────────────────────────────────────────────

/**
 * Extract plain text from a DOCX buffer using mammoth
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

/**
 * Convert DOCX to HTML using mammoth
 */
export async function convertDocxToHtml(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.convertToHtml({ buffer })
  return result.value
}

// ─── XLSX Utilities ───────────────────────────────────────────────────────────

/**
 * Read an XLSX workbook and return sheets as JSON arrays
 */
export async function readXlsx(buffer: Buffer): Promise<Record<string, unknown[][]>> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheets: Record<string, unknown[][]> = {}
  workbook.eachSheet((worksheet) => {
    const rows: unknown[][] = []
    worksheet.eachRow((row) => {
      rows.push(row.values as unknown[])
    })
    sheets[worksheet.name] = rows
  })
  return sheets
}

/**
 * Create a simple XLSX workbook from a 2D data array
 */
export async function createXlsx(
  sheetName: string,
  rows: unknown[][],
): Promise<Buffer> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)
  for (const row of rows) {
    sheet.addRow(row)
  }
  return workbook.xlsx.writeBuffer() as Promise<Buffer>
}

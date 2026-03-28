import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyWebhookSignature(secret: string, body: Buffer, signature: string): boolean {
  const trimmedSecret = secret.trim()

  // Try both buffer and utf8-string HMAC — some proxies re-encode the body
  const hmacBuf = createHmac('sha256', trimmedSecret)
  hmacBuf.update(body)
  const expectedFromBuffer = `sha256=${hmacBuf.digest('hex')}`
  const hmacStr = createHmac('sha256', trimmedSecret)
  hmacStr.update(body.toString('utf8'))
  const received = signature.trim()
  const expected = Buffer.from(expectedFromBuffer)
  const receivedBuf = Buffer.from(received)

  if (expected.length !== receivedBuf.length) return false

  return timingSafeEqual(expected, receivedBuf)
}

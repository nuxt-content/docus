import { createSign } from 'node:crypto'

function base64url(value: string): string {
  return Buffer.from(value).toString('base64url')
}

function buildJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId }))
  const data = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(data)
  return `${data}.${sign.sign(privateKey, 'base64url')}`
}

export async function getInstallationToken(installationId: number): Promise<string> {
  const config = useRuntimeConfig()
  const jwt = buildJwt(config.githubAppId, config.githubAppPrivateKey)

  const response = await $fetch<{ token: string }>(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'docus-doc-agent',
      },
    },
  )

  return response.token
}

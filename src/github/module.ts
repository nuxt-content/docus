import { Module } from '@nuxt/types'
import { logger } from '../core/util'
import { get, fetch } from './github'
import { useStorage } from '../core/storage'
import { DocusSettings } from 'src/types'

export default <Module>function docusGithubModule() {
  const { nuxt } = this
  const { hook, options } = nuxt

  options.privateRuntimeConfig = options.privateRuntimeConfig || {}
  options.privateRuntimeConfig.githubToken = process.env.GITHUB_TOKEN

  hook('docus:content:ready', async () => {
    try {
      const { storage } = useStorage()
      const settings = await storage.getItem('data:settings.json') as DocusSettings
      
      const releases = await fetch(settings.github)
      storage.setItem('data:github-releases.json', {
        releases
      })
    } catch (err) {
      logger.error(`Cannot fetch releases from Github, ${err}`)
    }
  })
}

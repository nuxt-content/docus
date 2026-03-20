export default defineEventHandler((event) => {
  const { skills } = useRuntimeConfig(event)

  setResponseHeader(event, 'content-type', 'application/json')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')

  return { skills: skills.catalog }
})

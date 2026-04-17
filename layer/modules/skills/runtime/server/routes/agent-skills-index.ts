export default defineEventHandler((event) => {
  const { skills } = useRuntimeConfig(event)

  setResponseHeader(event, 'content-type', 'application/json')
  setResponseHeader(event, 'cache-control', 'public, max-age=3600')
  setResponseHeader(event, 'access-control-allow-origin', '*')

  return {
    $schema: skills.schema,
    skills: skills.catalog,
  }
})

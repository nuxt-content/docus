import { createComarkSource } from '#agent-discovery/comark'

// Content v4: the v3 source reads `#content/manifest` and minimark bodies, which v4 dropped.
export default createComarkSource(() => content)

import { createNuxtContentWorker, sqliteFullTextSearch, sqliteWasm } from '@nuxt/content/worker'

// Only evaluated in the search worker, so sqlite-wasm stays out of the pages' bundle.
export default createNuxtContentWorker({
  plugins: [sqliteFullTextSearch({ database: sqliteWasm() })],
})

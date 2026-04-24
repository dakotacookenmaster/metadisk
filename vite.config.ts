import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { readFileSync } from 'node:fs'

// monaco-editor ships some sub-modules whose `//# sourceMappingURL=`
// comments point to .map files that aren't actually published to npm
// (e.g. marked.esm.js.map, purify.es.mjs.map). Vite reads the raw file
// from disk in `loadAndTransform` and tries to fetch the referenced map
// before plugin `transform` hooks run, which floods test/dev output with
// harmless ENOENT warnings. Intercepting at the `load` hook lets us
// return file contents with the broken sourceMappingURL comment already
// stripped, so Vite never tries to look the .map files up.
const stripBrokenMonacoSourceMaps = {
  name: 'strip-broken-monaco-sourcemaps',
  enforce: 'pre' as const,
  load(id: string) {
    const cleanId = id.split('?')[0]
    if (
      cleanId.includes('monaco-editor') &&
      (cleanId.endsWith('marked.js') || cleanId.endsWith('dompurify.js'))
    ) {
      const code = readFileSync(cleanId, 'utf-8')
      return code.replace(/\/\/[#@]\s*sourceMappingURL=.*$/gm, '')
    }
    return null
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [stripBrokenMonacoSourceMaps, react()],
  test: {
    environment: "jsdom",
    setupFiles: ['./vitest-setup.ts'],
    alias: {
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api'
    },
    // The default `forks` pool spawns one Node child process per worker.
    // On Windows that startup is slow enough to trip Vitest's hardcoded
    // 5-second `WORKER_START_TIMEOUT`, producing a flood of
    // `[vitest-pool]: Timeout starting forks runner` unhandled errors
    // even though every test still passes. The `threads` pool boots
    // workers via `worker_threads` instead, which is fast enough to
    // stay well under the same timeout.
    pool: 'threads',
  }
})

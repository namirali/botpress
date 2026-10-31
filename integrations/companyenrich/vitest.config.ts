import { fileURLToPath } from 'node:url'
import config from '../../vitest.config'

export default {
  ...config,
  resolve: { alias: { '.botpress': fileURLToPath(new URL('./.botpress/index.ts', import.meta.url)) } },
}

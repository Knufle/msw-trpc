import { copyFileSync } from 'node:fs'

for (const filename of ['README.md', 'LICENSE']) {
  copyFileSync(new URL(`../${filename}`, import.meta.url), new URL(`../packages/msw-trpc/${filename}`, import.meta.url))
}

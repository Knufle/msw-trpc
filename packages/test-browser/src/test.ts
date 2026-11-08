import { test as testBase } from 'vitest'
import { setupWorker } from 'msw/browser'
import type { SetupWorker } from 'msw/browser'

const worker = setupWorker()

export const test = testBase.extend<{ worker: SetupWorker }>({
  worker: [
    async ({}, use) => {
      await worker.start({ onUnhandledFrame: 'error' })
      try {
        await use(worker)
      } finally {
        worker.resetHandlers()
        await worker.stop()
      }
    },
    {
      auto: true,
    },
  ],
})

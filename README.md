<div align="center">
  <img src="https://raw.githubusercontent.com/Knufle/msw-trpc/main/assets/trpc-msw.png" style="height: 100px;"/>
  <h1>@knufle/msw-trpc</h1>
  <a href="https://www.npmjs.com/package/@knufle/msw-trpc"><img src="https://img.shields.io/npm/v/@knufle/msw-trpc.svg?style=flat&color=brightgreen" target="_blank" /></a>
  <a href="https://github.com/Knufle/msw-trpc/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-black" /></a>
  <br />
  <hr />
</div>

## **[tRPC](https://trpc.io/) support for [MSW](https://mswjs.io/)**

- Create MSW handlers from your tRPC router.
- Get your tRPC typing into your MSW handlers.
- Augments MSW with utils for tRPC.
- Use it like you would use the tRPC client.
- Merged routers supported !
- Use `msw` v3

This is an MSW 3 maintenance fork of [maloguertin/msw-trpc](https://github.com/maloguertin/msw-trpc),
originally authored by Malo Guertin. The handler API is unchanged. MSW is a peer dependency,
so the handlers use your application's MSW installation rather than installing a second copy.

## Motivation

As someone who loves MSW and was already using it I wanted to keep using it instead of mocking tRPC. While it is possible to simply write the Rest handlers it felt like it would be great not to lose the full power of tRPC types in the tests.

## Usage

**1. Install the fork and its peers.**

```bash
npm i -D @knufle/msw-trpc msw@^3 @trpc/server@^11
```

**2. build your trpcMsw with createTRPCMsw.**

```typescript
import { createTRPCMsw, httpLink } from '@knufle/msw-trpc'
import type { AppRouter } from 'path/to/your/router'

export const trpcMsw = createTRPCMsw<AppRouter>({
  links: [httpLink({ url: 'http://localhost:3000/trpc' })],
})
```

**3. Start using it.**

```typescript
import { setupServer } from 'msw/node'

const server = setupServer(
  trpcMsw.userById.query(() => ({ id: '1', name: 'Uncle bob' })),
  trpcMsw.createUser.mutation(({ input }) => ({ id: '2', name: input }))
)
```

You can find examples of how to use it in the [test-react](https://github.com/Knufle/msw-trpc/blob/main/packages/test-react/package.json) package or in the [test-node](https://github.com/Knufle/msw-trpc/blob/main/packages/test-node/package.json) package.

## How it works

`createTRPCMsw` returns a Proxy that infers types from your AppRouter

```typescript
// all queries will expose a query function that accepts a MSW handler
trpcMsw.myQuery.query(() => {})

// all mutations will expose a mutation function that accepts a MSW handler
trpcMsw.myMutation.mutation(() => {})
```

## Config

You need to pass a `httpLink` to the `createTRPCMsw` function like you would do with the tRPC client.

You can pass an optional transformer like `superjson` to the `createTRPCMsw` function.

```typescript
interface TRPCMswConfig {
  links: Link[]
  transformer?: TRPCCombinedDataTransformer
}
```

## Requirements

Peer dependencies:

- [`tRPC`](https://github.com/trpc/trpc) server v11 must be installed.
- [`msw`](https://github.com/mswjs/msw) v3 must be installed.
- Node.js >=22.12.0, TypeScript >=5.9, and an ESM-compatible environment.

Please note:

- Batch is not yet supported
- Subscriptions are not supported.

## Migrating from upstream

Replace imports from `msw-trpc` with `@knufle/msw-trpc`, or keep existing imports using an npm alias:

```json
{
  "devDependencies": {
    "msw-trpc": "npm:@knufle/msw-trpc@^3.0.0"
  }
}
```

When upgrading MSW itself, replace `onUnhandledRequest` with `onUnhandledFrame` and await
`worker.stop()` in browser teardown. See the [MSW 3 release notes](https://github.com/mswjs/msw/releases/tag/v3.0.0).

## Development and publishing

```bash
pnpm install --frozen-lockfile
pnpm type-check
pnpm --filter @knufle/msw-trpc build
pnpm --filter test-browser exec playwright install chromium
pnpm --filter test-node test --maxWorkers=1
pnpm --filter test-react test --maxWorkers=1
pnpm --filter test-browser test --maxWorkers=1
node scripts/check-package.mjs
```

CI runs these checks before publishing stable GitHub releases. See the
[npm setup and release guide](https://github.com/Knufle/msw-trpc/blob/main/docs/publishing.md)
for first-time account setup and token-free publishing.

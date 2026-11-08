import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const packageDir = new URL('../packages/msw-trpc/', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('package.json', packageDir), 'utf8'))
assert.equal(manifest.name, '@knufle/msw-trpc')
assert.equal(manifest.dependencies.msw, undefined)
assert.equal(manifest.peerDependencies.msw, '^3.0.0')

const directory = mkdtempSync(join(tmpdir(), 'msw-trpc-pack-'))
try {
  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', directory], {
      cwd: packageDir,
      encoding: 'utf8',
    })
  )
  const files = packed.files.map(({ path }) => path)
  for (const file of ['dist/index.js', 'dist/index.d.ts', 'dist/links.js', 'README.md', 'LICENSE']) {
    assert.ok(files.includes(file), `Missing package file: ${file}`)
  }
  writeFileSync(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      join(directory, packed.filename),
      'msw@3.0.3',
      '@trpc/server@^11',
    ],
    { cwd: directory, stdio: 'inherit' }
  )
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
        import assert from 'node:assert/strict';
        import { createTRPCMsw } from '@knufle/msw-trpc';
        import { httpLink } from '@knufle/msw-trpc/links';
        import { getResponse, RequestHandler } from 'msw';
        import { setupServer } from 'msw/node';
        import { TRPCError } from '@trpc/server';
        const handlers = createTRPCMsw({ links: [httpLink({ url: 'https://example.test/trpc' })] });
        const query = handlers.user.query(({ input }) => ({ id: input }));
        assert.ok(query instanceof RequestHandler, 'Handler must use the consumer MSW instance');
        const response = await getResponse([query], new Request('https://example.test/trpc/user?input=%22test%22'));
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), { result: { data: { id: 'test' } } });
        const mutation = handlers.createUser.mutation(({ input }) => ({ name: input }));
        const created = await getResponse([mutation], new Request('https://example.test/trpc/createUser', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify('Alice'),
        }));
        assert.deepEqual(await created.json(), { result: { data: { name: 'Alice' } } });
        const empty = handlers.deleteAllUsers.mutation(({ input }) => {
          assert.equal(input, undefined);
          return true;
        });
        const deleted = await getResponse([empty], new Request('https://example.test/trpc/deleteAllUsers', {
          method: 'POST',
        }));
        assert.deepEqual(await deleted.json(), { result: { data: true } });
        const nullInput = await getResponse([mutation], new Request('https://example.test/trpc/createUser', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: 'null',
        }));
        assert.deepEqual(await nullInput.json(), { result: { data: { name: null } } });
        const failing = handlers.user.query(() => {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Missing user' });
        });
        const error = await getResponse([failing], new Request('https://example.test/trpc/user'));
        assert.equal(error.status, 404);
        assert.equal((await error.json()).error.data.code, 'NOT_FOUND');
        const server = setupServer(query);
        server.listen({ onUnhandledFrame: 'error' });
        try {
          server.use(handlers.user.query(() => ({ id: 'override' })));
          const overridden = await fetch('https://example.test/trpc/user?input=%22test%22');
          assert.deepEqual(await overridden.json(), { result: { data: { id: 'override' } } });
          server.resetHandlers();
          const restored = await fetch('https://example.test/trpc/user?input=%22test%22');
          assert.deepEqual(await restored.json(), { result: { data: { id: 'test' } } });
        } finally {
          server.close();
        }
      `,
    ],
    { cwd: directory, stdio: 'inherit' }
  )
  console.log(`${packed.name}@${packed.version}: tarball contents, consumer ESM imports and MSW 3 handlers passed`)
} finally {
  rmSync(directory, { recursive: true, force: true })
}

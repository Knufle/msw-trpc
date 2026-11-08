# npm setup and releases

This fork publishes as `@knufle/msw-trpc`. The GitHub repository is `Knufle/msw-trpc`.
GitHub and npm accounts are separate: you must own the npm username `knufle`, or own an npm
organization named `knufle`. The package name was available when this fork was prepared,
but that does not prove the npm username is available.

If the npm scope is unavailable, stop before publishing. Choose a scope you own and update
the package name, build filters, smoke test, README, and this guide consistently.

## 1. Create your npm account

1. Open <https://www.npmjs.com/signup>.
2. Choose `knufle` as your username if available, and complete signup.
3. Verify the email address through npm's confirmation email.
4. Open your account settings from the account menu. Enable two-factor authentication
   using the options npm offers, and save recovery codes privately.
   See [npm's 2FA instructions](https://docs.npmjs.com/configuring-two-factor-authentication/).

Public scoped packages are free. You do not need a paid organization or subscription.
Never send your password, recovery codes, access token, or 2FA code to an AI/chat.

## 2. Publish the first version yourself

Trusted publishing is configured in an existing package's settings. Bootstrap the first
package with an interactive local publish, not a CI token.

Use Node.js 24 LTS and npm >=11.5.1 (Node >=22.14.0 is required for trusted publishing).
From a checkout of this fork, after its checks pass:

```bash
npm login --registry=https://registry.npmjs.org --auth-type=web --browser=false
npm whoami --registry=https://registry.npmjs.org
pnpm install --frozen-lockfile
pnpm --filter @knufle/msw-trpc build
node scripts/check-package.mjs
cd packages/msw-trpc
npm publish --access public --registry=https://registry.npmjs.org --browser=false
```

Copy the login URL npm prints into your browser and leave the terminal running while you
authenticate. Automatic browser launching is disabled to avoid WSL browser detection errors.
Complete npm's browser authentication/2FA prompts yourself, including any link printed during
publishing. If you own `knufle` as an
organization instead of a personal username, confirm your logged-in account has publishing
rights in that organization.

This uploads `@knufle/msw-trpc@3.0.0` publicly. A published version number cannot be reused.
The `prepack` hook copies the root README and MIT license into the package before packing.
Do not add `--provenance` to this local bootstrap publish: GitHub Actions will generate
provenance for subsequent releases.

Verify:

```bash
npm view @knufle/msw-trpc@3.0.0 version --registry=https://registry.npmjs.org
```

You can run `npm logout --registry=https://registry.npmjs.org` after bootstrapping.
No npm credentials belong in this repository.

## 3. Authorize GitHub Actions on npm

Open <https://www.npmjs.com/package/@knufle/msw-trpc>, select **Settings**, and find
**Trusted Publisher**. Select **GitHub Actions** and enter these exact, case-sensitive values:

| Field                | Value                                       |
| -------------------- | ------------------------------------------- |
| Organization or user | `Knufle`                                    |
| Repository           | `msw-trpc`                                  |
| Workflow filename    | `npm-publish.yml`                           |
| Environment name     | Leave blank                                 |
| Allowed actions      | Enable direct publishing with `npm publish` |

The workflow filename is just the filename, not `.github/workflows/npm-publish.yml`.
New trusted publishers may default to staged publishing only; explicitly allow `npm publish`.
Save the configuration and complete any requested 2FA challenge.

Under **Publishing access**, you can select **Require two-factor authentication and disallow
tokens**. Trusted publishing still works with that setting.

See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).

## 4. GitHub configuration

In <https://github.com/Knufle/msw-trpc/actions>, enable workflows if GitHub prompts you
to enable Actions on the fork.

**No custom repository secrets, variables, or GitHub environments are required.**

| Item                                                | Required?                       | Reason                                                             |
| --------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------ |
| `NPM_TOKEN`, `npm_token`, `NODE_AUTH_TOKEN` secrets | No                              | npm authenticates using GitHub's short-lived OIDC token            |
| Repository variables or `.env` file                 | No                              | Package metadata and workflow contain the non-secret configuration |
| `GITHUB_TOKEN` secret configured by you             | No                              | GitHub creates the job token automatically                         |
| GitHub environment named `npm`                      | No                              | This workflow does not reference an environment                    |
| `id-token: write` permission                        | Yes, already in the publish job | Allows npm to request an OIDC identity token                       |

If you later add a GitHub environment for manual approvals, put the same environment name
in both the publish job and npm's trusted publisher configuration.

## 5. Publish subsequent versions

After the local bootstrap, the next version is `3.0.1`; do not try to publish `3.0.0` again.

1. Change `packages/msw-trpc/package.json` to the new version.
2. Commit and push the tested changes to `main`.
3. In <https://github.com/Knufle/msw-trpc/releases/new>, create a matching tag such as
   `v3.0.1` at that commit.
4. Publish a **stable** release, not a draft or prerelease.
5. Watch **Publish to npm** in Actions and verify the version on npm.

The workflow checks out and tests that exact tag, verifies the version matches,
and publishes with provenance. Node 24 includes an npm CLI new enough for OIDC.
It intentionally rejects prereleases instead of accidentally tagging them as `latest`.

If publishing failed after tests passed, fix the configuration and retry using the
**Run workflow** button for **Publish to npm**, entering the existing tag. Do not rerun
a successful publish: npm correctly rejects republishing an existing version.

The first successful OIDC release still needs to be verified after account setup.
Until then, green CI confirms compatibility and packaging, not npm publishing permission.

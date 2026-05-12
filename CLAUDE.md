# @supaproxy/viper-ai-providers

AI provider plugins for the Viper code review tool. Part of the Viper product within the SupaProxy ecosystem.

See the [central hub](https://github.com/NumstackPtyLtd/supaproxy) for cross-repo governance, workflow, and conventions.

## What this package does

This package provides a plugin registry and built-in AI provider implementations for Viper. The server imports this package, registers plugins, and uses the registry to create AI reviewers at runtime. Each plugin implements the `AiPlugin` interface, which defines how to create a reviewer, verify API keys, and describe its configuration schema and available models.

## Project structure

```
src/
  index.ts            Public exports, auto-registers built-in plugins
  types.ts            Core interfaces: AiPlugin, AiReviewer, AiPluginConfig, etc.
  registry.ts         PluginRegistry class (Map-based, keyed by type string)
  claude/
    plugin.ts          ClaudePlugin (implements AiPlugin)
    reviewer.ts        ClaudeReviewer (implements AiReviewer, uses Anthropic SDK)
```

## Plugin/registry pattern

Every AI provider is a plugin that implements the `AiPlugin` interface:

```
interface AiPlugin {
  readonly type: string
  readonly name: string
  readonly description: string
  readonly configSchema: ConfigField[]
  readonly models: AiModel[]
  createReviewer(config: AiPluginConfig): AiReviewer
  verifyKey(apiKey: string): Promise<{ valid: boolean; error?: string }>
}
```

Plugins register themselves with the singleton `registry`:

```
import { registry } from './registry.js'
registry.register(myPlugin)
```

The registry provides `get(type)`, `has(type)`, `list()`, and `schemas()` methods. The server uses `registry.get(type)` to obtain a plugin, then calls `createReviewer()` with the user's API key and model selection.

Built-in plugins are auto-registered when the package is imported. The current built-in plugin is `claudePlugin`.

## Adding a new AI provider

1. Create a new directory under `src/` named after the provider (e.g. `src/openai/`).
2. Create `plugin.ts` implementing `AiPlugin`. Set `type` to a unique slug (e.g. `"openai"`).
3. Create `reviewer.ts` implementing `AiReviewer` with `review()` and `respondToDiscussion()` methods.
4. Create `plugin.test.ts` with unit tests.
5. Export the plugin instance from `src/index.ts`.
6. Add `registry.register(yourPlugin)` in `src/index.ts` alongside existing registrations.
7. If the provider SDK is a peer dependency, add it to `peerDependencies` with `optional: true`.

## Git workflow

NEVER push directly to `main`. NEVER run destructive git commands (`push --force`, `reset --hard`, `clean -f`).

All changes go through pull requests:

1. Create a feature branch: `git checkout -b {feat|fix|chore|docs}/description`
2. Make commits on the branch.
3. Push the branch: `git push -u origin {branch}`
4. Create a PR: `gh pr create`
5. Squash merge to main via the GitHub UI.

## Code standards

### Type safety

- No `any` types. Create interfaces for all API responses and function parameters.
- No `as any` casts. Define proper interfaces instead.

### Provider agnosticism

- No hardcoded provider names in user-facing output. Say "AI provider" or "language model".
- No provider-specific token formats as placeholders (no `sk-ant-` or `sk-` prefixes in examples).
- No hardcoded model IDs outside plugin implementations. Models are declared per plugin in the `models` array.
- The registry is provider-agnostic. All provider-specific logic lives inside the plugin directory.

### No hardcoded values

- No env var fallbacks. Use `requireEnv()` with no defaults.
- No hardcoded API URLs, secrets, or magic numbers outside plugin configuration.
- API endpoints and model IDs belong in the plugin, not in shared code.

### Error handling

- Check `res.ok` before parsing JSON responses.
- No empty catch blocks. Every `.catch()` must log the actual error.
- `verifyKey()` must never throw; it returns `{ valid: false, error }` on failure.

### Writing standards

- British English throughout (colour, organisation, behaviour, licence).
- No em dashes or en dashes. Use commas, full stops, or semicolons.
- No smart quotes. Use straight quotes only.
- Sentence case for headings.

## Scripts

```bash
npm run build          # Compile TypeScript
npm run lint           # Type check without emitting
npm run test           # Run tests with Vitest
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

## Publishing

Published to npm as `@supaproxy/viper-ai-providers`. Follow semver strictly. All tests and build must pass before publishing. Update CHANGELOG.md before every release.

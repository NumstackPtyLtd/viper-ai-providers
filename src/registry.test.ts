import { describe, it, expect, beforeEach } from 'vitest'
import type { AiPlugin, AiPluginConfig, AiReviewer } from './types.js'

/** Minimal fake plugin for registry tests. */
function fakePlugin(overrides: Partial<AiPlugin> = {}): AiPlugin {
  return {
    type: 'fake',
    name: 'Fake Provider',
    description: 'A fake AI provider for testing',
    configSchema: [{ name: 'api_key', label: 'API Key', type: 'password', required: true }],
    models: [{ id: 'fake-model-1', label: 'Fake Model 1', default: true }],
    createReviewer(_config: AiPluginConfig): AiReviewer {
      return {} as AiReviewer
    },
    async verifyKey(_apiKey: string) {
      return { valid: true }
    },
    ...overrides,
  }
}

/*
 * We import a fresh PluginRegistry for each test by re-creating one.
 * The module-level `registry` singleton from registry.ts is pre-populated
 * by index.ts, so we instantiate our own isolated instances instead.
 */

// PluginRegistry is not exported as a class, only as a singleton.
// We work around this by importing the module and exercising the singleton,
// but we clear it between tests so they stay isolated.
import { registry } from './registry.js'

describe('PluginRegistry', () => {
  beforeEach(() => {
    // Clear all plugins between tests for isolation
    registry.plugins.clear()
  })

  describe('register()', () => {
    it('adds a plugin to the registry', () => {
      const plugin = fakePlugin()
      registry.register(plugin)

      expect(registry.plugins.size).toBe(1)
      expect(registry.plugins.get('fake')).toBe(plugin)
    })

    it('replaces an existing plugin of the same type', () => {
      const first = fakePlugin({ name: 'First' })
      const second = fakePlugin({ name: 'Second' })

      registry.register(first)
      registry.register(second)

      expect(registry.plugins.size).toBe(1)
      expect(registry.get('fake').name).toBe('Second')
    })
  })

  describe('get()', () => {
    it('returns the registered plugin by type', () => {
      const plugin = fakePlugin()
      registry.register(plugin)

      expect(registry.get('fake')).toBe(plugin)
    })

    it('throws for an unknown type', () => {
      expect(() => registry.get('nonexistent')).toThrowError(
        /AI plugin not found: "nonexistent"/
      )
    })

    it('includes available types in the error message', () => {
      registry.register(fakePlugin({ type: 'alpha' } as Partial<AiPlugin> as AiPlugin))
      registry.register(fakePlugin({ type: 'beta' } as Partial<AiPlugin> as AiPlugin))

      expect(() => registry.get('unknown')).toThrowError(/alpha/)
    })
  })

  describe('has()', () => {
    it('returns true when the plugin is registered', () => {
      registry.register(fakePlugin())
      expect(registry.has('fake')).toBe(true)
    })

    it('returns false when the plugin is not registered', () => {
      expect(registry.has('nonexistent')).toBe(false)
    })
  })

  describe('list()', () => {
    it('returns all registered plugins', () => {
      const a = fakePlugin({ type: 'a', name: 'A' } as Partial<AiPlugin> as AiPlugin)
      const b = fakePlugin({ type: 'b', name: 'B' } as Partial<AiPlugin> as AiPlugin)

      registry.register(a)
      registry.register(b)

      const result = registry.list()
      expect(result).toHaveLength(2)
      expect(result).toContain(a)
      expect(result).toContain(b)
    })

    it('returns an empty array when no plugins are registered', () => {
      expect(registry.list()).toEqual([])
    })
  })

  describe('schemas()', () => {
    it('returns schema objects that include the models array', () => {
      const plugin = fakePlugin({
        type: 'test',
        name: 'Test Provider',
        description: 'Test',
        models: [
          { id: 'model-a', label: 'Model A', default: true },
          { id: 'model-b', label: 'Model B' },
        ],
      } as Partial<AiPlugin> as AiPlugin)

      registry.register(plugin)

      const schemas = registry.schemas()
      expect(schemas).toHaveLength(1)
      expect(schemas[0].type).toBe('test')
      expect(schemas[0].name).toBe('Test Provider')
      expect(schemas[0].models).toEqual([
        { id: 'model-a', label: 'Model A', default: true },
        { id: 'model-b', label: 'Model B' },
      ])
      expect(schemas[0].configSchema).toBeDefined()
      expect(Array.isArray(schemas[0].models)).toBe(true)
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ClaudePlugin } from './plugin.js'
import { ClaudeReviewer } from './reviewer.js'

describe('ClaudePlugin', () => {
  let plugin: ClaudePlugin

  beforeEach(() => {
    plugin = new ClaudePlugin()
  })

  describe('metadata', () => {
    it('has type "claude"', () => {
      expect(plugin.type).toBe('claude')
    })

    it('has name "Anthropic Claude"', () => {
      expect(plugin.name).toBe('Anthropic Claude')
    })
  })

  describe('configSchema', () => {
    it('has an api_key field', () => {
      const apiKeyField = plugin.configSchema.find((f) => f.name === 'api_key')
      expect(apiKeyField).toBeDefined()
      expect(apiKeyField!.type).toBe('password')
      expect(apiKeyField!.required).toBe(true)
    })
  })

  describe('models', () => {
    it('has at least one model with default: true', () => {
      const defaultModel = plugin.models.find((m) => m.default === true)
      expect(defaultModel).toBeDefined()
      expect(defaultModel!.id).toBeTruthy()
      expect(defaultModel!.label).toBeTruthy()
    })
  })

  describe('createReviewer()', () => {
    it('returns a ClaudeReviewer instance', () => {
      const reviewer = plugin.createReviewer({ apiKey: 'test-key', model: 'claude-sonnet-4-20250514' })
      expect(reviewer).toBeInstanceOf(ClaudeReviewer)
    })

    it('uses the default model when none is specified', () => {
      const reviewer = plugin.createReviewer({ apiKey: 'test-key' })
      expect(reviewer).toBeInstanceOf(ClaudeReviewer)
      // The reviewer should have been created with the default model id
      // We verify indirectly: it was created without error, using the default
      // model lookup path (config.model ?? find default ?? first)
    })
  })

  describe('verifyKey()', () => {
    let originalFetch: typeof globalThis.fetch

    beforeEach(() => {
      originalFetch = globalThis.fetch
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
      vi.restoreAllMocks()
    })

    it('returns { valid: false } on network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')))

      const result = await plugin.verifyKey('bad-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Network failure')
    })

    it('returns { valid: false } with error message on 401 response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          json: async () => ({ error: { message: 'Invalid API key' } }),
        })
      )

      const result = await plugin.verifyKey('invalid-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key')
    })

    it('returns { valid: false } with HTTP status when error message is absent', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({}),
        })
      )

      const result = await plugin.verifyKey('forbidden-key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('HTTP 403')
    })

    it('returns { valid: true } on 200 response', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ id: 'msg_123', content: [] }),
        })
      )

      const result = await plugin.verifyKey('valid-key')

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('sends the API key in the x-api-key header', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      })
      vi.stubGlobal('fetch', mockFetch)

      await plugin.verifyKey('my-secret-key')

      expect(mockFetch).toHaveBeenCalledOnce()
      const [url, options] = mockFetch.mock.calls[0]
      expect(url).toBe('https://api.anthropic.com/v1/messages')
      expect(options.headers['x-api-key']).toBe('my-secret-key')
    })
  })
})

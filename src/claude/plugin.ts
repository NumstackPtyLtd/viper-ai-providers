import type { AiPlugin, AiPluginConfig, AiReviewer, AiModel, ConfigField } from '../types.js'
import { ClaudeReviewer } from './reviewer.js'

export class ClaudePlugin implements AiPlugin {
  readonly type = 'claude'
  readonly name = 'Anthropic Claude'
  readonly description = 'Claude AI models by Anthropic'

  readonly configSchema: ConfigField[] = [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, helpText: 'console.anthropic.com > API Keys. Needs usage permissions.' },
  ]

  readonly models: AiModel[] = [
    { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', default: true },
    { id: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  ]

  createReviewer(config: AiPluginConfig): AiReviewer {
    const model = config.model ?? this.models.find((m) => m.default)?.id ?? this.models[0].id
    return new ClaudeReviewer(config.apiKey, model)
  }

  async verifyKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        }),
      })
      if (res.ok) return { valid: true }
      const data = await res.json() as { error?: { message?: string } }
      return { valid: false, error: data.error?.message ?? `HTTP ${res.status}` }
    } catch (err) {
      return { valid: false, error: (err as Error).message }
    }
  }
}

export const claudePlugin = new ClaudePlugin()

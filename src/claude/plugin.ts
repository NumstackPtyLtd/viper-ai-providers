import type { AiPlugin, AiPluginConfig, AiReviewer, AiModel, ConfigField } from '../types.js'
import { ClaudeReviewer } from './reviewer.js'

export class ClaudePlugin implements AiPlugin {
  readonly type = 'claude'
  readonly name = 'Anthropic Claude'
  readonly description = 'Claude AI models by Anthropic'

  readonly configSchema: ConfigField[] = [
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, helpText: 'console.anthropic.com > API Keys. Needs usage permissions.' },
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
}

export const claudePlugin = new ClaudePlugin()

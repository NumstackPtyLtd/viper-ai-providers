import pino from 'pino'
import type { AiPlugin } from './types.js'

const log = pino({ name: 'ai-registry' })

class PluginRegistry {
  readonly plugins = new Map<string, AiPlugin>()

  register(plugin: AiPlugin): void {
    if (this.plugins.has(plugin.type)) {
      log.warn({ type: plugin.type }, 'Plugin already registered, replacing')
    }
    this.plugins.set(plugin.type, plugin)
    log.info({ type: plugin.type, name: plugin.name }, 'AI plugin registered')
  }

  get(type: string): AiPlugin {
    const plugin = this.plugins.get(type)
    if (!plugin) {
      const available = Array.from(this.plugins.keys()).join(', ')
      throw new Error(`AI plugin not found: "${type}". Available: ${available || 'none'}`)
    }
    return plugin
  }

  has(type: string): boolean {
    return this.plugins.has(type)
  }

  list(): AiPlugin[] {
    return Array.from(this.plugins.values())
  }

  schemas(): Array<{
    type: string; name: string; description: string
    configSchema: AiPlugin['configSchema']; models: AiPlugin['models']
  }> {
    return this.list().map((p) => ({
      type: p.type, name: p.name, description: p.description,
      configSchema: p.configSchema, models: p.models,
    }))
  }
}

export const registry = new PluginRegistry()

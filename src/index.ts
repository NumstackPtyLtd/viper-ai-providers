// Types
export type {
  AiPlugin, AiPluginConfig, AiReviewer, AiModel, ConfigField,
  AiReviewRequest, AiReviewFinding, AiReviewResult, AiDiscussionRequest,
} from './types.js'

// Registry
export { registry } from './registry.js'

// Plugins (exported for direct use / testing)
export { claudePlugin } from './claude/plugin.js'

// Auto-register all built-in plugins
import { registry } from './registry.js'
import { claudePlugin } from './claude/plugin.js'

registry.register(claudePlugin)

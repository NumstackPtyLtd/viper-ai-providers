/** Request to review a diff. */
export interface AiReviewRequest {
  diff: string
  mrTitle: string
  mrDescription: string | null
  customRules: string[]
  focusAreas: string[]
  tone: string
  language: string
}

/** A single finding from the AI review. */
export interface AiReviewFinding {
  file: string
  line: number
  severity: 'critical' | 'warning' | 'suggestion' | 'praise'
  comment: string
}

/** Result of an AI review. */
export interface AiReviewResult {
  summary: string
  findings: AiReviewFinding[]
}

/** Request to respond to a discussion thread. */
export interface AiDiscussionRequest {
  originalComment: string
  developerReply: string
  diffContext: string
}

/** AI reviewer operations: the contract adapters implement. */
export interface AiReviewer {
  review(request: AiReviewRequest): Promise<AiReviewResult>
  respondToDiscussion(request: AiDiscussionRequest): Promise<string>
}

/** Configuration schema field for settings forms. */
export interface ConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'url' | 'textarea'
  required: boolean
  placeholder?: string
  defaultValue?: string
  helpText?: string
  advanced?: boolean
}

/** AI model metadata. */
export interface AiModel {
  id: string
  label: string
  default?: boolean
}

/** Configuration for creating an AI reviewer instance. */
export interface AiPluginConfig {
  apiKey: string
  model?: string
}

/** AI Plugin: the contract every AI provider must implement. */
export interface AiPlugin {
  readonly type: string
  readonly name: string
  readonly description: string
  readonly configSchema: ConfigField[]
  readonly models: AiModel[]

  createReviewer(config: AiPluginConfig): AiReviewer

  /** Verify an API key is valid. Returns { valid, error? }. */
  verifyKey(apiKey: string): Promise<{ valid: boolean; error?: string }>
}

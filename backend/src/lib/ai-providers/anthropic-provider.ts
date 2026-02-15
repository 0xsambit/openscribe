import {
  BaseAIProvider,
  GenerationOptions,
  CompletionResult,
  EmbeddingResult,
} from './base-provider';

/**
 * Anthropic provider (Claude Opus, Sonnet, Haiku)
 * Uses the Anthropic Messages API directly.
 */
export class AnthropicProvider extends BaseAIProvider {
  private baseUrl = 'https://api.anthropic.com/v1';
  private apiVersion = '2023-06-01';

  async generateCompletion(prompt: string, options?: GenerationOptions): Promise<CompletionResult> {
    return this.withRetry(async () => {
      const body: Record<string, unknown> = {
        model: this.modelName,
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        messages: [{ role: 'user', content: prompt }],
      };

      if (options?.systemPrompt) {
        body.system = options.systemPrompt;
      }

      if (options?.topP !== undefined) {
        body.top_p = options.topP;
      }

      if (options?.stopSequences) {
        body.stop_sequences = options.stopSequences;
      }

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: { message: response.statusText } }))) as { error?: { message?: string } };
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = (await response.json()) as { content: { type: string; text: string }[]; usage?: { input_tokens: number; output_tokens: number }; model: string };

      const text = data.content
        .filter((block: { type: string }) => block.type === 'text')
        .map((block: { text: string }) => block.text)
        .join('');

      return {
        text,
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        model: data.model,
      };
    });
  }

  async generateEmbedding(_text: string): Promise<EmbeddingResult> {
    // Anthropic doesn't have a native embedding API.
    // For users who only have Anthropic keys, we'll use a simple char-based hash embedding
    // as a fallback. In production, recommend OpenAI or Ollama for embeddings.
    throw new Error(
      'Anthropic does not provide an embedding API. Please add an OpenAI or Ollama API key for embedding generation.'
    );
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Send a minimal request to check if the key works
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion,
        },
        body: JSON.stringify({
          model: this.modelName,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    const costs: Record<string, { input: number; output: number }> = {
      'claude-opus-4-20250514': { input: 15 / 1_000_000, output: 75 / 1_000_000 },
      'claude-sonnet-4-20250514': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      'claude-3-5-sonnet-20241022': { input: 3 / 1_000_000, output: 15 / 1_000_000 },
      'claude-3-5-haiku-20241022': { input: 0.8 / 1_000_000, output: 4 / 1_000_000 },
    };

    const pricing = costs[this.modelName] || costs['claude-sonnet-4-20250514'];
    return promptTokens * pricing.input + completionTokens * pricing.output;
  }
}

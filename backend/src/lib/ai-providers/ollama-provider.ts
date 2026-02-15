import {
  BaseAIProvider,
  GenerationOptions,
  CompletionResult,
  EmbeddingResult,
} from './base-provider';
import { env } from '../../config/env';

/**
 * Ollama provider for local AI models.
 * Connects to a locally running Ollama instance.
 */
export class OllamaProvider extends BaseAIProvider {
  private baseUrl: string;

  constructor(apiKey: string, modelName: string, maxRetries = 2) {
    super(apiKey, modelName, maxRetries);
    // Ollama doesn't use API keys, but we keep the interface consistent.
    // The apiKey field can be 'ollama' or any placeholder.
    this.baseUrl = env.OLLAMA_BASE_URL;
  }

  async generateCompletion(prompt: string, options?: GenerationOptions): Promise<CompletionResult> {
    return this.withRetry(async () => {
      const messages: { role: string; content: string }[] = [];

      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            top_p: options?.topP,
            num_predict: options?.maxTokens || 2048,
            stop: options?.stopSequences,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${error}`);
      }

      const data = (await response.json()) as { message?: { content: string }; prompt_eval_count?: number; eval_count?: number; model?: string };

      return {
        text: data.message?.content || '',
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        model: data.model || this.modelName,
      };
    });
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          input: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama Embedding API error: ${error}`);
      }

      const data = (await response.json()) as { embeddings?: number[][]; embedding?: number[]; model?: string };

      return {
        embedding: data.embeddings?.[0] || data.embedding || [],
        model: data.model || this.modelName,
        tokenCount: 0, // Ollama doesn't always report token count for embeddings
      };
    });
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(_promptTokens: number, _completionTokens: number): number {
    // Local models are free
    return 0;
  }
}

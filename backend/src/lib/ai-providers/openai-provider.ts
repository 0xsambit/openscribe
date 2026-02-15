import {
  BaseAIProvider,
  GenerationOptions,
  CompletionResult,
  EmbeddingResult,
} from './base-provider';

/**
 * OpenAI provider (GPT-4o, GPT-4-turbo, GPT-3.5-turbo, etc.)
 * Uses the OpenAI REST API directly to avoid heavy SDK dependency.
 */
export class OpenAIProvider extends BaseAIProvider {
  private baseUrl = 'https://api.openai.com/v1';
  private embeddingModel = 'text-embedding-3-small';

  async generateCompletion(prompt: string, options?: GenerationOptions): Promise<CompletionResult> {
    return this.withRetry(async () => {
      const messages: { role: string; content: string }[] = [];

      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          max_tokens: options?.maxTokens || 2048,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.topP,
          stop: options?.stopSequences,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: { message: response.statusText } }))) as { error?: { message?: string } };
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = (await response.json()) as { choices: { message: { content: string } }[]; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }; model: string };

      return {
        text: data.choices[0].message.content,
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        model: data.model,
      };
    });
  }

  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.embeddingModel,
          input: text,
        }),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({ error: { message: response.statusText } }))) as { error?: { message?: string } };
        throw new Error(`OpenAI Embedding API error: ${error.error?.message || response.statusText}`);
      }

      const data = (await response.json()) as { data: { embedding: number[] }[]; model: string; usage?: { total_tokens: number } };

      return {
        embedding: data.data[0].embedding,
        model: data.model,
        tokenCount: data.usage?.total_tokens || 0,
      };
    });
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  estimateCost(promptTokens: number, completionTokens: number): number {
    // Rough pricing for GPT-4o (as of 2025)
    const costs: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 2.5 / 1_000_000, output: 10 / 1_000_000 },
      'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
      'gpt-4-turbo': { input: 10 / 1_000_000, output: 30 / 1_000_000 },
      'gpt-3.5-turbo': { input: 0.5 / 1_000_000, output: 1.5 / 1_000_000 },
    };

    const pricing = costs[this.modelName] || costs['gpt-4o'];
    return promptTokens * pricing.input + completionTokens * pricing.output;
  }
}

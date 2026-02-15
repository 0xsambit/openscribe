export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

export interface CompletionResult {
  text: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokenCount: number;
}

/**
 * Abstract base class for AI providers.
 * Implements retry logic and error normalization.
 */
export abstract class BaseAIProvider {
  protected apiKey: string;
  protected modelName: string;
  protected maxRetries: number;

  constructor(apiKey: string, modelName: string, maxRetries = 3) {
    this.apiKey = apiKey;
    this.modelName = modelName;
    this.maxRetries = maxRetries;
  }

  abstract generateCompletion(prompt: string, options?: GenerationOptions): Promise<CompletionResult>;
  abstract generateEmbedding(text: string): Promise<EmbeddingResult>;
  abstract validateApiKey(): Promise<boolean>;

  get providerName(): string {
    return this.constructor.name;
  }

  /**
   * Retry wrapper with exponential backoff.
   */
  protected async withRetry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on auth errors or validation errors
        const message = (error as Error).message?.toLowerCase() || '';
        if (message.includes('auth') || message.includes('invalid api key') || message.includes('401')) {
          throw error;
        }

        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Estimate cost in USD for a given number of tokens.
   */
  abstract estimateCost(promptTokens: number, completionTokens: number): number;
}

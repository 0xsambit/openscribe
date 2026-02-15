import { BaseAIProvider } from './base-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';
import { OllamaProvider } from './ollama-provider';
import { apiKeysService } from '../../modules/api-keys/api-keys.service';
import { AppError } from '../../middleware/error-handler.middleware';

/**
 * Factory for creating AI provider instances based on user configuration.
 */
export class ProviderFactory {
  /**
   * Get an AI provider for the given user.
   * Optionally specify a preferred provider; otherwise picks the first active key.
   */
  static async getProvider(userId: string, preferredProvider?: string): Promise<BaseAIProvider> {
    const keyData = await apiKeysService.getDecryptedKey(userId, preferredProvider);

    if (!keyData) {
      throw AppError.badRequest(
        preferredProvider
          ? `No active API key found for provider: ${preferredProvider}. Please add one in Settings.`
          : 'No active AI provider configured. Please add an API key in Settings.',
        'NO_AI_PROVIDER'
      );
    }

    return ProviderFactory.createProvider(keyData.provider, keyData.apiKey, keyData.modelName);
  }

  /**
   * Get an embedding provider for the given user.
   * Prefers OpenAI or Ollama since Anthropic doesn't support embeddings.
   */
  static async getEmbeddingProvider(userId: string): Promise<BaseAIProvider> {
    // Try OpenAI first (best embedding support)
    const openaiKey = await apiKeysService.getDecryptedKey(userId, 'openai');
    if (openaiKey) {
      return new OpenAIProvider(openaiKey.apiKey, openaiKey.modelName);
    }

    // Try Ollama
    const ollamaKey = await apiKeysService.getDecryptedKey(userId, 'ollama');
    if (ollamaKey) {
      return new OllamaProvider(ollamaKey.apiKey, ollamaKey.modelName);
    }

    throw AppError.badRequest(
      'No embedding-capable AI provider found. Please add an OpenAI or Ollama API key.',
      'NO_EMBEDDING_PROVIDER'
    );
  }

  /**
   * Create a provider instance from raw credentials.
   */
  static createProvider(provider: string, apiKey: string, modelName: string): BaseAIProvider {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(apiKey, modelName);
      case 'anthropic':
        return new AnthropicProvider(apiKey, modelName);
      case 'ollama':
        return new OllamaProvider(apiKey, modelName);
      case 'groq':
        // Groq uses OpenAI-compatible API
        return new OpenAIProvider(apiKey, modelName);
      case 'custom':
        // Custom providers use OpenAI-compatible API
        return new OpenAIProvider(apiKey, modelName);
      default:
        throw AppError.badRequest(`Unsupported AI provider: ${provider}`);
    }
  }
}

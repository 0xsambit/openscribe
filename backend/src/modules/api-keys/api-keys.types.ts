import { z } from 'zod';

export const createApiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'groq', 'ollama', 'custom']),
  apiKey: z.string().min(1, 'API key is required'),
  modelName: z.string().min(1, 'Model name is required'),
});

export const updateApiKeySchema = z.object({
  apiKey: z.string().min(1).optional(),
  modelName: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeySchema>;

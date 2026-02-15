import { z } from 'zod';

export const generateStrategySchema = z.object({
  strategyType: z.enum(['weekly', 'monthly', 'campaign']).default('weekly'),
  postingFrequency: z.number().min(1).max(14).default(3),
  targetAudience: z.object({
    description: z.string().min(1),
    industries: z.array(z.string()).default([]),
    roles: z.array(z.string()).default([]),
    interests: z.array(z.string()).default([]),
  }),
  goals: z.object({
    primary: z.enum(['thought_leadership', 'lead_generation', 'community_building', 'brand_awareness']),
    secondary: z.array(z.string()).default([]),
    kpis: z.array(z.string()).default([]),
  }),
});

export type GenerateStrategyInput = z.infer<typeof generateStrategySchema>;

import { z } from 'zod';

export const generateContentSchema = z.object({
  strategyId: z.string().uuid().optional(),
  topic: z.string().min(1, 'Topic is required'),
  postType: z.enum(['educational', 'storytelling', 'opinion', 'case_study', 'how_to', 'list']).optional(),
  additionalGuidance: z.string().max(500).optional(),
  count: z.number().min(1).max(5).default(1),
});

export const updateDraftSchema = z.object({
  postText: z.string().min(1).optional(),
  status: z.enum(['draft', 'approved', 'rejected', 'published']).optional(),
});

export const submitFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

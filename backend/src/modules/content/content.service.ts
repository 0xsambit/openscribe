import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';
import { ProviderFactory } from '../../lib/ai-providers/provider-factory';
import { loadPrompt } from '../../lib/prompts/prompt-loader';
import { GenerateContentInput, UpdateDraftInput, SubmitFeedbackInput } from './content.types';
import type { PostStatus, LinkedInPost, GeneratedPost } from '@prisma/client';

export class ContentService {
  /**
   * Generate content drafts (async job).
   */
  async startContentGeneration(userId: string, input: GenerateContentInput): Promise<string> {
    const job = await prisma.job.create({
      data: {
        userId,
        jobType: 'generate_content',
        status: 'pending',
        inputData: input as any,
      },
    });

    this.processContentGeneration(userId, job.id, input).catch((err) => {
      console.error('Content generation failed:', err);
    });

    return job.id;
  }

  async processContentGeneration(userId: string, jobId: string, input: GenerateContentInput): Promise<void> {
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'processing', progress: 10 },
      });

      // Get user details and style profile
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw AppError.notFound('User not found');

      const preferences = (user.preferences as Record<string, unknown>) || {};
      const styleProfile = preferences.writingStyle || {};

      // Get strategy if specified
      let strategyGuidance = '';
      if (input.strategyId) {
        const strategy = await prisma.contentStrategy.findFirst({
          where: { id: input.strategyId, userId },
        });
        if (strategy) {
          const themes = (strategy.themes as unknown[]) || [];
          const relevantTheme = themes.find(
            (t: any) => t.topic?.toLowerCase().includes(input.topic.toLowerCase())
          );
          strategyGuidance = relevantTheme
            ? JSON.stringify(relevantTheme)
            : `Part of ${strategy.strategyType} strategy. Posting frequency: ${strategy.postingFrequency}x/week.`;
        }
      }

      // Get similar past posts for few-shot examples
      const pastPosts = await prisma.linkedInPost.findMany({
        where: { userId },
        orderBy: { likesCount: 'desc' },
        take: 5,
      });

      const examplePosts = pastPosts
        .map((p: LinkedInPost, i: number) => `Example ${i + 1} [${p.likesCount} likes]:\n${p.postText}`)
        .join('\n\n---\n\n');

      await prisma.job.update({ where: { id: jobId }, data: { progress: 30 } });

      const provider = await ProviderFactory.getProvider(userId);
      const generatedPosts: string[] = [];

      for (let i = 0; i < (input.count || 1); i++) {
        const prompt = loadPrompt('generate_post.txt', {
          authorName: user.name,
          styleProfile: JSON.stringify(styleProfile, null, 2),
          examplePosts: examplePosts || 'No previous posts available.',
          topic: input.topic,
          postType: input.postType || 'educational',
          strategyGuidance: strategyGuidance || 'No specific strategy guidance.',
          additionalGuidance: input.additionalGuidance || '',
        });

        const result = await provider.generateCompletion(prompt, {
          temperature: 0.8,
          maxTokens: 1500,
          systemPrompt: `You are ${user.name}, writing LinkedIn posts. Match the writing style exactly. Respond with valid JSON only.`,
        });

        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            await prisma.generatedPost.create({
              data: {
                userId,
                strategyId: input.strategyId,
                postText: parsed.postText || result.text,
                topic: parsed.topic || input.topic,
                hook: parsed.hook || '',
                cta: parsed.cta || '',
                generationMetadata: {
                  model: result.model,
                  provider: provider.providerName,
                  temperature: 0.8,
                  promptTokens: result.promptTokens,
                  completionTokens: result.completionTokens,
                },
              },
            });

            generatedPosts.push(parsed.postText || result.text);
          } else {
            // Fallback: treat entire response as post text
            await prisma.generatedPost.create({
              data: {
                userId,
                strategyId: input.strategyId,
                postText: result.text,
                topic: input.topic,
                hook: '',
                cta: '',
                generationMetadata: {
                  model: result.model,
                  provider: provider.providerName,
                  temperature: 0.8,
                  promptTokens: result.promptTokens,
                  completionTokens: result.completionTokens,
                },
              },
            });
            generatedPosts.push(result.text);
          }
        } catch {
          // Save raw text if JSON parsing fails
          await prisma.generatedPost.create({
            data: {
              userId,
              strategyId: input.strategyId,
              postText: result.text,
              topic: input.topic,
              hook: '',
              cta: '',
              generationMetadata: {
                model: result.model,
                provider: provider.providerName,
                temperature: 0.8,
                promptTokens: result.promptTokens,
                completionTokens: result.completionTokens,
              },
            },
          });
          generatedPosts.push(result.text);
        }

        const progress = 30 + Math.round((70 * (i + 1)) / (input.count || 1));
        await prisma.job.update({ where: { id: jobId }, data: { progress } });
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          resultData: { postsGenerated: generatedPosts.length },
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: (error as Error).message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /**
   * List generated drafts with filters.
   */
  async listDrafts(
    userId: string,
    options: { page?: number; pageSize?: number; status?: string }
  ) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { userId };
    if (options.status) {
      where.status = options.status;
    }

    const [drafts, total] = await Promise.all([
      prisma.generatedPost.findMany({
        where: where as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.generatedPost.count({ where: where as any }),
    ]);

    return {
      data: drafts.map((d: GeneratedPost) => ({
        id: d.id,
        strategyId: d.strategyId,
        postText: d.postText,
        topic: d.topic,
        hook: d.hook,
        cta: d.cta,
        generationMetadata: d.generationMetadata,
        status: d.status,
        userFeedback: d.userFeedback,
        feedbackRating: d.feedbackRating,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single draft.
   */
  async getDraft(userId: string, draftId: string) {
    const draft = await prisma.generatedPost.findFirst({
      where: { id: draftId, userId },
    });

    if (!draft) {
      throw AppError.notFound('Draft not found');
    }

    return {
      id: draft.id,
      strategyId: draft.strategyId,
      postText: draft.postText,
      topic: draft.topic,
      hook: draft.hook,
      cta: draft.cta,
      generationMetadata: draft.generationMetadata,
      status: draft.status,
      userFeedback: draft.userFeedback,
      feedbackRating: draft.feedbackRating,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  /**
   * Update a draft.
   */
  async updateDraft(userId: string, draftId: string, input: UpdateDraftInput) {
    const existing = await prisma.generatedPost.findFirst({
      where: { id: draftId, userId },
    });

    if (!existing) {
      throw AppError.notFound('Draft not found');
    }

    const updated = await prisma.generatedPost.update({
      where: { id: draftId },
      data: {
        ...(input.postText !== undefined && { postText: input.postText }),
        ...(input.status !== undefined && { status: input.status as PostStatus }),
      },
    });

    return {
      id: updated.id,
      postText: updated.postText,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Submit feedback for a draft.
   */
  async submitFeedback(userId: string, draftId: string, input: SubmitFeedbackInput) {
    const existing = await prisma.generatedPost.findFirst({
      where: { id: draftId, userId },
    });

    if (!existing) {
      throw AppError.notFound('Draft not found');
    }

    const updated = await prisma.generatedPost.update({
      where: { id: draftId },
      data: {
        feedbackRating: input.rating,
        userFeedback: input.feedback,
        status: input.rating >= 4 ? 'approved' : input.rating <= 2 ? 'rejected' : existing.status,
      },
    });

    return {
      id: updated.id,
      feedbackRating: updated.feedbackRating,
      userFeedback: updated.userFeedback,
      status: updated.status,
    };
  }

  /**
   * Delete a draft.
   */
  async deleteDraft(userId: string, draftId: string) {
    const existing = await prisma.generatedPost.findFirst({
      where: { id: draftId, userId },
    });

    if (!existing) {
      throw AppError.notFound('Draft not found');
    }

    await prisma.generatedPost.delete({ where: { id: draftId } });
  }
}

export const contentService = new ContentService();

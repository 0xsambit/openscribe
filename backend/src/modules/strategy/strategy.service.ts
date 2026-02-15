import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';
import { ProviderFactory } from '../../lib/ai-providers/provider-factory';
import { loadPrompt } from '../../lib/prompts/prompt-loader';
import { GenerateStrategyInput } from './strategy.types';
import type { StrategyType, ContentStrategy } from '@prisma/client';

export class StrategyService {
  /**
   * Generate a content strategy (async job).
   */
  async startStrategyGeneration(userId: string, input: GenerateStrategyInput): Promise<string> {
    const job = await prisma.job.create({
      data: {
        userId,
        jobType: 'generate_strategy',
        status: 'pending',
        inputData: input as any,
      },
    });

    this.processStrategyGeneration(userId, job.id, input).catch((err) => {
      console.error('Strategy generation failed:', err);
    });

    return job.id;
  }

  async processStrategyGeneration(userId: string, jobId: string, input: GenerateStrategyInput): Promise<void> {
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'processing', progress: 10 },
      });

      // Get user's style profile
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const preferences = (user?.preferences as Record<string, unknown>) || {};
      const styleProfile = preferences.writingStyle || {};

      // Get latest topic analysis from completed jobs
      const topicJob = await prisma.job.findFirst({
        where: { userId, jobType: 'analyze_posts', status: 'completed' },
        orderBy: { completedAt: 'desc' },
      });

      const topicAnalysis = topicJob?.resultData || {};

      await prisma.job.update({ where: { id: jobId }, data: { progress: 30 } });

      // Generate strategy via AI
      const provider = await ProviderFactory.getProvider(userId);

      const prompt = loadPrompt('generate_strategy.txt', {
        styleProfile: JSON.stringify(styleProfile, null, 2),
        topicAnalysis: JSON.stringify(topicAnalysis, null, 2),
        primaryGoal: input.goals.primary,
        targetAudience: input.targetAudience.description,
        postingFrequency: String(input.postingFrequency),
        strategyType: input.strategyType,
      });

      const result = await provider.generateCompletion(prompt, {
        temperature: 0.5,
        maxTokens: 3000,
        systemPrompt: 'You are an expert LinkedIn content strategist. Respond with valid JSON only.',
      });

      await prisma.job.update({ where: { id: jobId }, data: { progress: 70 } });

      // Parse strategy result
      let strategyData: Record<string, unknown> = {};
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          strategyData = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.warn('Failed to parse strategy response');
      }

      // Calculate expiration
      const expiresAt = new Date();
      switch (input.strategyType) {
        case 'weekly':
          expiresAt.setDate(expiresAt.getDate() + 7);
          break;
        case 'monthly':
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          break;
        case 'campaign':
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          break;
      }

      // Save strategy
      const strategy = await prisma.contentStrategy.create({
        data: {
          userId,
          strategyType: input.strategyType as StrategyType,
          themes: strategyData.themes || [],
          postingFrequency: input.postingFrequency,
          targetAudience: input.targetAudience as any,
          goals: input.goals as any,
          expiresAt,
        },
      });

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          resultData: {
            strategyId: strategy.id,
            ...strategyData,
          },
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
   * Get the current active strategy for a user.
   */
  async getCurrentStrategy(userId: string) {
    const strategy = await prisma.contentStrategy.findFirst({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (!strategy) {
      return null;
    }

    return {
      id: strategy.id,
      strategyType: strategy.strategyType,
      themes: strategy.themes,
      postingFrequency: strategy.postingFrequency,
      targetAudience: strategy.targetAudience,
      goals: strategy.goals,
      generatedAt: strategy.generatedAt.toISOString(),
      expiresAt: strategy.expiresAt.toISOString(),
    };
  }

  /**
   * List all strategies for a user.
   */
  async listStrategies(userId: string) {
    const strategies = await prisma.contentStrategy.findMany({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
      take: 10,
    });

    return strategies.map((s: ContentStrategy) => ({
      id: s.id,
      strategyType: s.strategyType,
      themes: s.themes,
      postingFrequency: s.postingFrequency,
      targetAudience: s.targetAudience,
      goals: s.goals,
      generatedAt: s.generatedAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    }));
  }
}

export const strategyService = new StrategyService();

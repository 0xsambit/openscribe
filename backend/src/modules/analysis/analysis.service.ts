import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';
import { ProviderFactory } from '../../lib/ai-providers/provider-factory';
import { loadPrompt } from '../../lib/prompts/prompt-loader';
import { analyzePost, aggregateMetrics } from './algorithms/style-analyzer';
import { analyzeEngagement, analyzeTopicPerformance } from './algorithms/engagement-analyzer';
import { extractTopics } from './algorithms/topic-extractor';
import { linkedInService } from '../linkedin/linkedin.service';
import type { LinkedInPost, User } from '@prisma/client';

export class AnalysisService {
  /**
   * Analyze writing style (creates a job, returns job ID).
   */
  async startStyleAnalysis(userId: string): Promise<string> {
    const postCount = await linkedInService.getPostCount(userId);
    if (postCount < 3) {
      throw AppError.badRequest('You need at least 3 imported posts to analyze writing style.');
    }

    const job = await prisma.job.create({
      data: {
        userId,
        jobType: 'analyze_posts',
        status: 'pending',
        inputData: { type: 'style_analysis' },
      },
    });

    // Process inline for MVP (in production, this would be queued via BullMQ)
    this.processStyleAnalysis(userId, job.id).catch((err) => {
      console.error('Style analysis failed:', err);
    });

    return job.id;
  }

  /**
   * Process style analysis job.
   */
  async processStyleAnalysis(userId: string, jobId: string): Promise<void> {
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'processing', progress: 10 },
      });

      // Get all posts
      const posts = await linkedInService.getAllUserPosts(userId);

      // Step 1: Calculate linguistic metrics
      await prisma.job.update({ where: { id: jobId }, data: { progress: 30 } });

      const postMetrics = posts.map((p: LinkedInPost) =>
        analyzePost(p.postText, {
          likes: p.likesCount,
          comments: p.commentsCount,
          shares: p.sharesCount,
        })
      );

      const { metrics, engagementCorrelations } = aggregateMetrics(postMetrics);

      // Step 2: AI-enhanced style analysis
      await prisma.job.update({ where: { id: jobId }, data: { progress: 50 } });

      let aiStyleAnalysis: Record<string, unknown> = {};
      try {
        const provider = await ProviderFactory.getProvider(userId);

        const postsForPrompt = posts
          .slice(0, 15)
          .map((p: LinkedInPost, i: number) => `Post ${i + 1} [Likes: ${p.likesCount}]:\n${p.postText}`)
          .join('\n\n---\n\n');

        const prompt = loadPrompt('analyze_writing_style.txt', { posts: postsForPrompt });

        const result = await provider.generateCompletion(prompt, {
          temperature: 0.3,
          maxTokens: 2048,
          systemPrompt: 'You are a writing analysis expert. Respond with valid JSON only.',
        });

        try {
          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            aiStyleAnalysis = JSON.parse(jsonMatch[0]);
          }
        } catch {
          console.warn('Failed to parse AI style analysis response');
        }
      } catch (err) {
        console.warn('AI style analysis skipped (no provider):', (err as Error).message);
      }

      await prisma.job.update({ where: { id: jobId }, data: { progress: 80 } });

      // Combine results
      const styleProfile = {
        avgSentenceLength: metrics.avgSentenceLength,
        vocabularyDiversity: metrics.vocabularyDiversity,
        readingLevel: metrics.readingLevel,
        toneDistribution: (aiStyleAnalysis as any)?.toneDistribution || {
          professional: 50,
          casual: 25,
          motivational: 15,
          storytelling: 10,
        },
        structuralPatterns: {
          questionUsage: metrics.questionFrequency,
          listFormatFrequency: metrics.listFormatFrequency,
          emojiDensity: metrics.emojiDensity,
          avgPostLength: metrics.avgPostLength,
          hookPatterns: (aiStyleAnalysis as any)?.hookPatterns || [],
          ctaPatterns: (aiStyleAnalysis as any)?.ctaPatterns || [],
        },
        engagementCorrelations,
        summary: (aiStyleAnalysis as any)?.summary || `Analyzed ${posts.length} posts with an average length of ${Math.round(metrics.avgPostLength)} words.`,
        voiceCharacteristics: (aiStyleAnalysis as any)?.voiceCharacteristics || [],
        uniquePhrases: (aiStyleAnalysis as any)?.uniquePhrases || [],
      };

      // Save style profile to user preferences
      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            ...((await prisma.user.findUnique({ where: { id: userId } }).then((u: User | null) => (u?.preferences as Record<string, unknown>) || {})) as Record<string, unknown>),
            writingStyle: styleProfile,
          },
        },
      });

      // Mark job complete
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          resultData: styleProfile,
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
   * Start topic extraction job.
   */
  async startTopicExtraction(userId: string): Promise<string> {
    const postCount = await linkedInService.getPostCount(userId);
    if (postCount < 3) {
      throw AppError.badRequest('You need at least 3 imported posts to extract topics.');
    }

    const job = await prisma.job.create({
      data: {
        userId,
        jobType: 'analyze_posts',
        status: 'pending',
        inputData: { type: 'topic_extraction' },
      },
    });

    this.processTopicExtraction(userId, job.id).catch((err) => {
      console.error('Topic extraction failed:', err);
    });

    return job.id;
  }

  async processTopicExtraction(userId: string, jobId: string): Promise<void> {
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'processing', progress: 10 },
      });

      const posts = await linkedInService.getAllUserPosts(userId);

      await prisma.job.update({ where: { id: jobId }, data: { progress: 30 } });

      const topicResult = await extractTopics(
        userId,
        posts.map((p: LinkedInPost) => ({
          postText: p.postText,
          likesCount: p.likesCount,
          commentsCount: p.commentsCount,
          sharesCount: p.sharesCount,
        }))
      );

      await prisma.job.update({ where: { id: jobId }, data: { progress: 80 } });

      // Update posts with extracted topics
      for (const topic of topicResult.topics) {
        // Find posts matching this topic's keywords
        for (const post of posts) {
          const text = post.postText.toLowerCase();
          const matches = topic.keywords.some((kw) => text.includes(kw.toLowerCase()));
          if (matches && !post.topics.includes(topic.label)) {
            await prisma.linkedInPost.update({
              where: { id: post.id },
              data: { topics: [...post.topics, topic.label] },
            });
          }
        }
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          resultData: topicResult as any,
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
   * Get job status and result.
   */
  async getJobResult(userId: string, jobId: string) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw AppError.notFound('Job not found');
    }

    return {
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      progress: job.progress,
      resultData: job.resultData,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    };
  }

  /**
   * Get engagement analytics.
   */
  async getEngagementAnalytics(userId: string) {
    const posts = await linkedInService.getAllUserPosts(userId);

    return analyzeEngagement(
      posts.map((p: LinkedInPost) => ({
        id: p.id,
        postText: p.postText,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        postedAt: p.postedAt,
        topics: p.topics,
      }))
    );
  }

  /**
   * Get topic performance analytics.
   */
  async getTopicAnalytics(userId: string) {
    const posts = await linkedInService.getAllUserPosts(userId);

    return analyzeTopicPerformance(
      posts.map((p: LinkedInPost) => ({
        id: p.id,
        postText: p.postText,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        postedAt: p.postedAt,
        topics: p.topics,
      }))
    );
  }
}

export const analysisService = new AnalysisService();

import crypto from 'crypto';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error-handler.middleware';
import { parseLinkedInCSV } from './parsers/csv-parser';
import { parseLinkedInJSON } from './parsers/json-parser';
import type { ParsedPost } from './parsers/csv-parser';
import type { LinkedInPost } from '@prisma/client';

export class LinkedInService {
  /**
   * Import posts from uploaded file (CSV or JSON).
   */
  async importPosts(userId: string, fileContent: string, fileType: 'csv' | 'json') {
    let parsedPosts: ParsedPost[];

    try {
      parsedPosts = fileType === 'csv'
        ? parseLinkedInCSV(fileContent)
        : parseLinkedInJSON(fileContent);
    } catch (error) {
      throw AppError.badRequest(`Failed to parse file: ${(error as Error).message}`);
    }

    if (parsedPosts.length === 0) {
      throw AppError.badRequest('No valid posts found in the uploaded file');
    }

    // Deduplicate by text hash
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const post of parsedPosts) {
      const postTextHash = crypto
        .createHash('sha256')
        .update(post.postText)
        .digest('hex');

      try {
        await prisma.linkedInPost.create({
          data: {
            userId,
            postText: post.postText,
            postTextHash,
            postUrl: post.postUrl,
            likesCount: post.likesCount,
            commentsCount: post.commentsCount,
            sharesCount: post.sharesCount,
            postedAt: post.postedAt,
          },
        });
        imported++;
      } catch (error) {
        // Unique constraint violation = duplicate
        if ((error as { code?: string }).code === 'P2002') {
          skipped++;
        } else {
          errors.push(`Failed to import post: ${post.postText.substring(0, 50)}...`);
        }
      }
    }

    return {
      totalParsed: parsedPosts.length,
      totalImported: imported,
      duplicatesSkipped: skipped,
      errors,
    };
  }

  /**
   * List user's imported posts with pagination.
   */
  async listPosts(
    userId: string,
    options: { page?: number; pageSize?: number; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { userId };

    if (options.search) {
      where.postText = { contains: options.search, mode: 'insensitive' };
    }

    const orderBy: Record<string, string> = {};
    const sortField = options.sortBy || 'postedAt';
    orderBy[sortField] = options.sortOrder || 'desc';

    const [posts, total] = await Promise.all([
      prisma.linkedInPost.findMany({
        where: where as any,
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.linkedInPost.count({ where: where as any }),
    ]);

    return {
      data: posts.map((p: LinkedInPost) => ({
        id: p.id,
        postText: p.postText,
        postUrl: p.postUrl,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        postedAt: p.postedAt.toISOString(),
        topics: p.topics,
        sentimentScore: p.sentimentScore,
        createdAt: p.createdAt.toISOString(),
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
   * Get a single post by ID.
   */
  async getPost(userId: string, postId: string) {
    const post = await prisma.linkedInPost.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      throw AppError.notFound('Post not found');
    }

    return {
      id: post.id,
      postText: post.postText,
      postUrl: post.postUrl,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      postedAt: post.postedAt.toISOString(),
      topics: post.topics,
      sentimentScore: post.sentimentScore,
      createdAt: post.createdAt.toISOString(),
    };
  }

  /**
   * Delete a specific post.
   */
  async deletePost(userId: string, postId: string) {
    const post = await prisma.linkedInPost.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      throw AppError.notFound('Post not found');
    }

    await prisma.linkedInPost.delete({ where: { id: postId } });
  }

  /**
   * Get all posts for a user (for analysis - internal use).
   */
  async getAllUserPosts(userId: string) {
    return prisma.linkedInPost.findMany({
      where: { userId },
      orderBy: { postedAt: 'desc' },
    });
  }

  /**
   * Get post count for a user.
   */
  async getPostCount(userId: string) {
    return prisma.linkedInPost.count({ where: { userId } });
  }
}

export const linkedInService = new LinkedInService();

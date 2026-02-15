import { parse } from 'csv-parse/sync';

export interface ParsedPost {
  postText: string;
  postUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  postedAt: Date;
}

/**
 * Parse LinkedIn CSV export format.
 * LinkedIn's export format varies, so we handle multiple possible column names.
 */
export function parseLinkedInCSV(csvContent: string): ParsedPost[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (records.length === 0) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const posts: ParsedPost[] = [];

  for (const record of records) {
    const postText = findField(record, [
      'postText', 'ShareCommentary', 'Commentary', 'Post', 'post_text', 'PostText',
      'text', 'Text', 'content', 'Content', 'body', 'Body',
      'ShareCommentary ', // LinkedIn sometimes has trailing space
    ]);

    if (!postText || postText.trim().length === 0) continue;

    const postedAtStr = findField(record, [
      'postedAt', 'Date', 'date', 'Posted', 'posted_at', 'PostedAt',
      'created_at', 'CreatedAt', 'timestamp', 'Timestamp',
      'ShareDate', 'Created Date',
    ]);

    const postedAt = postedAtStr ? new Date(postedAtStr) : new Date();
    if (isNaN(postedAt.getTime())) continue;

    posts.push({
      postText: postText.trim(),
      postUrl: findField(record, ['Url', 'url', 'URL', 'post_url', 'PostUrl', 'postUrl', 'ShareLink', 'Link']) || undefined,
      likesCount: parseIntSafe(findField(record, ['likesCount', 'Likes', 'likes', 'likes_count', 'LikesCount', 'Reactions', 'reactions'])),
      commentsCount: parseIntSafe(findField(record, ['commentsCount', 'Comments', 'comments', 'comments_count', 'CommentsCount'])),
      sharesCount: parseIntSafe(findField(record, ['sharesCount', 'Shares', 'shares', 'shares_count', 'SharesCount', 'Reposts', 'reposts'])),
      postedAt,
    });
  }

  return posts;
}

function findField(record: Record<string, string>, possibleNames: string[]): string | null {
  // First try exact match
  for (const name of possibleNames) {
    if (record[name] !== undefined && record[name] !== null && record[name] !== '') {
      return record[name];
    }
  }
  // Fallback: case-insensitive match
  const lowerNames = possibleNames.map((n) => n.trim().toLowerCase());
  for (const key of Object.keys(record)) {
    if (lowerNames.includes(key.trim().toLowerCase()) && record[key] !== '') {
      return record[key];
    }
  }
  return null;
}

function parseIntSafe(value: string | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/[,\s]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

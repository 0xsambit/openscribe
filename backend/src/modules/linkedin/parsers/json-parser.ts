import { ParsedPost } from './csv-parser';

interface JsonPostRecord {
  text?: string;
  postText?: string;
  post_text?: string;
  content?: string;
  body?: string;
  commentary?: string;

  url?: string;
  postUrl?: string;
  post_url?: string;
  link?: string;

  likes?: number | string;
  likesCount?: number | string;
  likes_count?: number | string;
  reactions?: number | string;

  comments?: number | string;
  commentsCount?: number | string;
  comments_count?: number | string;

  shares?: number | string;
  sharesCount?: number | string;
  shares_count?: number | string;
  reposts?: number | string;

  date?: string;
  postedAt?: string;
  posted_at?: string;
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
}

/**
 * Parse JSON format LinkedIn post data.
 * Supports both array of posts and object with posts array.
 */
export function parseLinkedInJSON(jsonContent: string): ParsedPost[] {
  let data: unknown;
  try {
    data = JSON.parse(jsonContent);
  } catch {
    throw new Error('Invalid JSON format');
  }

  let records: JsonPostRecord[];

  if (Array.isArray(data)) {
    records = data;
  } else if (typeof data === 'object' && data !== null) {
    // Try common wrapper keys
    const obj = data as Record<string, unknown>;
    records = (obj.posts || obj.data || obj.items || obj.results || []) as JsonPostRecord[];
    if (!Array.isArray(records)) {
      throw new Error('JSON must be an array of posts or an object with a "posts", "data", or "items" array');
    }
  } else {
    throw new Error('JSON must be an array of posts or an object containing posts');
  }

  if (records.length === 0) {
    throw new Error('No posts found in JSON data');
  }

  const posts: ParsedPost[] = [];

  for (const record of records) {
    const postText = record.text || record.postText || record.post_text || record.content || record.body || record.commentary;

    if (!postText || postText.trim().length === 0) continue;

    const dateStr = record.date || record.postedAt || record.posted_at || record.createdAt || record.created_at || record.timestamp;
    const postedAt = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(postedAt.getTime())) continue;

    posts.push({
      postText: postText.trim(),
      postUrl: (record.url || record.postUrl || record.post_url || record.link || undefined) as string | undefined,
      likesCount: toInt(record.likes || record.likesCount || record.likes_count || record.reactions || 0),
      commentsCount: toInt(record.comments || record.commentsCount || record.comments_count || 0),
      sharesCount: toInt(record.shares || record.sharesCount || record.shares_count || record.reposts || 0),
      postedAt,
    });
  }

  return posts;
}

function toInt(value: number | string): number {
  if (typeof value === 'number') return Math.floor(value);
  const parsed = parseInt(String(value).replace(/[,\s]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Engagement metrics analyzer.
 * Calculates engagement rates, trends, and identifies top-performing content.
 */

interface PostData {
  id: string;
  postText: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  postedAt: Date;
  topics: string[];
}

export interface EngagementStats {
  totalPosts: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgEngagementScore: number;
  topPerformingIds: string[];
  bottomPerformingIds: string[];
  weeklyTrends: { week: string; avgScore: number; postCount: number }[];
  dayOfWeekAnalysis: { day: string; avgScore: number; postCount: number }[];
}

/**
 * Calculate engagement score for a single post.
 * Weighted: likes(1x) + comments(2x) + shares(3x)
 */
export function calculateEngagementScore(likes: number, comments: number, shares: number): number {
  return likes + comments * 2 + shares * 3;
}

/**
 * Analyze engagement metrics across all posts.
 */
export function analyzeEngagement(posts: PostData[]): EngagementStats {
  if (posts.length === 0) {
    return {
      totalPosts: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      avgEngagementScore: 0,
      topPerformingIds: [],
      bottomPerformingIds: [],
      weeklyTrends: [],
      dayOfWeekAnalysis: [],
    };
  }

  const n = posts.length;
  const totalLikes = posts.reduce((s, p) => s + p.likesCount, 0);
  const totalComments = posts.reduce((s, p) => s + p.commentsCount, 0);
  const totalShares = posts.reduce((s, p) => s + p.sharesCount, 0);

  // Score each post
  const scored = posts.map((p) => ({
    ...p,
    score: calculateEngagementScore(p.likesCount, p.commentsCount, p.sharesCount),
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  const avgScore = scored.reduce((s, p) => s + p.score, 0) / n;
  const topN = Math.max(1, Math.ceil(n * 0.1)); // Top 10%

  // Generate weekly trend
  const weeklyTrends = generateWeeklyTrend(scored);

  // Day of week performance
  const dayOfWeekAnalysis = analyzeDayOfWeek(scored);

  return {
    totalPosts: n,
    avgLikes: totalLikes / n,
    avgComments: totalComments / n,
    avgShares: totalShares / n,
    avgEngagementScore: avgScore,
    topPerformingIds: scored.slice(0, topN).map((p) => p.id),
    bottomPerformingIds: scored.slice(-topN).map((p) => p.id),
    weeklyTrends,
    dayOfWeekAnalysis,
  };
}

function generateWeeklyTrend(posts: (PostData & { score: number })[]): { week: string; avgScore: number; postCount: number }[] {
  if (posts.length === 0) return [];

  // Group by week
  const weekMap = new Map<string, number[]>();

  for (const post of posts) {
    const date = new Date(post.postedAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(post.score);
  }

  return Array.from(weekMap.entries())
    .map(([week, scores]) => ({
      week,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      postCount: scores.length,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function analyzeDayOfWeek(posts: (PostData & { score: number })[]): { day: string; avgScore: number; postCount: number }[] {
  const dayScores = new Map<number, number[]>();

  for (const post of posts) {
    const day = new Date(post.postedAt).getDay();
    if (!dayScores.has(day)) dayScores.set(day, []);
    dayScores.get(day)!.push(post.score);
  }

  return Array.from(dayScores.entries())
    .map(([day, scores]) => ({
      day: DAY_NAMES[day],
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      postCount: scores.length,
    }))
    .sort((a, b) => DAY_NAMES.indexOf(a.day) - DAY_NAMES.indexOf(b.day));
}

/**
 * Analyze topic performance.
 */
export function analyzeTopicPerformance(posts: PostData[]): { name: string; postCount: number; avgEngagement: number }[] {
  const topicMap = new Map<string, number[]>();

  for (const post of posts) {
    const score = calculateEngagementScore(post.likesCount, post.commentsCount, post.sharesCount);
    for (const topic of post.topics) {
      if (!topicMap.has(topic)) topicMap.set(topic, []);
      topicMap.get(topic)!.push(score);
    }
  }

  return Array.from(topicMap.entries())
    .map(([name, scores]) => ({
      name,
      postCount: scores.length,
      avgEngagement: scores.reduce((a, b) => a + b, 0) / scores.length,
    }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

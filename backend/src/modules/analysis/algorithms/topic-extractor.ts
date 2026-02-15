import { ProviderFactory } from '@/lib/ai-providers/provider-factory';
import { loadPrompt } from '@/lib/prompts/prompt-loader';

/**
 * LLM-based topic extraction.
 * Sends batches of posts to the AI and extracts themes/topics.
 */
export async function extractTopics(
  userId: string,
  posts: { postText: string; likesCount: number; commentsCount: number; sharesCount: number }[]
): Promise<{
  topics: {
    label: string;
    keywords: string[];
    postCount: number;
    avgEngagement: number;
    trend: 'rising' | 'stable' | 'declining';
  }[];
  contentGaps: string[];
  recommendedMix: { primary: string[]; secondary: string[]; experimental: string[] };
}> {
  const provider = await ProviderFactory.getProvider(userId);

  // Format posts for the prompt (batch in groups for context window limits)
  const batchSize = 20;
  const allTopics: Record<string, { keywords: string[]; postCount: number; engagements: number[] }> = {};
  let contentGaps: string[] = [];
  let recommendedMix = { primary: [] as string[], secondary: [] as string[], experimental: [] as string[] };

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);

    const postsForPrompt = batch
      .map(
        (p, idx) =>
          `Post ${i + idx + 1} [Likes: ${p.likesCount}, Comments: ${p.commentsCount}, Shares: ${p.sharesCount}]:\n${p.postText}\n`
      )
      .join('\n---\n');

    const prompt = loadPrompt('extract_topics.txt', { posts: postsForPrompt });

    const result = await provider.generateCompletion(prompt, {
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: 'You are a content analysis expert. Always respond with valid JSON only.',
    });

    try {
      const parsed = JSON.parse(extractJson(result.text));

      if (parsed.topics) {
        for (const topic of parsed.topics) {
          const label = topic.label?.toLowerCase() || 'unknown';
          if (!allTopics[label]) {
            allTopics[label] = { keywords: [], postCount: 0, engagements: [] };
          }
          allTopics[label].keywords.push(...(topic.keywords || []));
          allTopics[label].postCount += topic.postCount || 1;
          allTopics[label].engagements.push(topic.avgEngagement || 0);
        }
      }

      if (parsed.contentGaps) contentGaps = [...contentGaps, ...parsed.contentGaps];
      if (parsed.recommendedMix) recommendedMix = parsed.recommendedMix;
    } catch {
      console.warn('Failed to parse topic extraction response for batch', i);
    }
  }

  // Consolidate topics
  const topics = Object.entries(allTopics)
    .map(([label, data]) => ({
      label,
      keywords: [...new Set(data.keywords)].slice(0, 10),
      postCount: data.postCount,
      avgEngagement: data.engagements.reduce((a, b) => a + b, 0) / Math.max(data.engagements.length, 1),
      trend: 'stable' as const,
    }))
    .sort((a, b) => b.avgEngagement * b.postCount - a.avgEngagement * a.postCount);

  return {
    topics: topics.slice(0, 15),
    contentGaps: [...new Set(contentGaps)].slice(0, 5),
    recommendedMix,
  };
}

/**
 * Extract JSON from a response that may contain markdown code blocks.
 */
function extractJson(text: string): string {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

/**
 * Pure TypeScript writing style analyzer.
 * Calculates quantifiable linguistic metrics from posts.
 */

export interface LinguisticMetrics {
  avgSentenceLength: number;
  avgWordLength: number;
  vocabularyDiversity: number;
  readingLevel: number;
  avgPostLength: number;
  questionFrequency: number;
  exclamationFrequency: number;
  emojiDensity: number;
  listFormatFrequency: number;
  paragraphCount: number;
  hashtagUsage: number;
}

export interface PostMetrics extends LinguisticMetrics {
  engagementScore: number;
}

/**
 * Calculate linguistic metrics for a single post.
 */
export function analyzePost(postText: string, engagement: { likes: number; comments: number; shares: number }): PostMetrics {
  const sentences = postText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = postText.split(/\s+/).filter((w) => w.length > 0);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-zA-Z]/g, '')).filter((w) => w.length > 0));
  const paragraphs = postText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const questions = (postText.match(/\?/g) || []).length;
  const exclamations = (postText.match(/!/g) || []).length;
  const emojis = (postText.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
  const lists = (postText.match(/^[\s]*[-•●✅⭐🔹▪️\d]+[.)\]]/gm) || []).length;
  const hashtags = (postText.match(/#\w+/g) || []).length;

  // Flesch-Kincaid Grade Level approximation
  const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const readingLevel = 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59;

  // Engagement score: likes + comments*2 + shares*3
  const engagementScore = engagement.likes + engagement.comments * 2 + engagement.shares * 3;

  return {
    avgSentenceLength: wordCount / sentenceCount,
    avgWordLength: words.reduce((acc, w) => acc + w.length, 0) / wordCount,
    vocabularyDiversity: uniqueWords.size / wordCount,
    readingLevel: Math.max(0, readingLevel),
    avgPostLength: wordCount,
    questionFrequency: questions / sentenceCount,
    exclamationFrequency: exclamations / sentenceCount,
    emojiDensity: emojis / wordCount,
    listFormatFrequency: lists > 0 ? 1 : 0,
    paragraphCount: paragraphs.length,
    hashtagUsage: hashtags,
    engagementScore,
  };
}

/**
 * Aggregate metrics across all posts.
 */
export function aggregateMetrics(postMetrics: PostMetrics[]): {
  metrics: LinguisticMetrics;
  engagementCorrelations: { attribute: string; correlation: number }[];
} {
  if (postMetrics.length === 0) {
    return {
      metrics: emptyMetrics(),
      engagementCorrelations: [],
    };
  }

  const n = postMetrics.length;
  const metrics: LinguisticMetrics = {
    avgSentenceLength: avg(postMetrics.map((m) => m.avgSentenceLength)),
    avgWordLength: avg(postMetrics.map((m) => m.avgWordLength)),
    vocabularyDiversity: avg(postMetrics.map((m) => m.vocabularyDiversity)),
    readingLevel: avg(postMetrics.map((m) => m.readingLevel)),
    avgPostLength: avg(postMetrics.map((m) => m.avgPostLength)),
    questionFrequency: avg(postMetrics.map((m) => m.questionFrequency)),
    exclamationFrequency: avg(postMetrics.map((m) => m.exclamationFrequency)),
    emojiDensity: avg(postMetrics.map((m) => m.emojiDensity)),
    listFormatFrequency: postMetrics.filter((m) => m.listFormatFrequency > 0).length / n,
    paragraphCount: avg(postMetrics.map((m) => m.paragraphCount)),
    hashtagUsage: avg(postMetrics.map((m) => m.hashtagUsage)),
  };

  // Calculate engagement correlations
  const engagements = postMetrics.map((m) => m.engagementScore);
  const attributes: { name: string; values: number[] }[] = [
    { name: 'sentence_length', values: postMetrics.map((m) => m.avgSentenceLength) },
    { name: 'vocabulary_diversity', values: postMetrics.map((m) => m.vocabularyDiversity) },
    { name: 'post_length', values: postMetrics.map((m) => m.avgPostLength) },
    { name: 'question_usage', values: postMetrics.map((m) => m.questionFrequency) },
    { name: 'emoji_density', values: postMetrics.map((m) => m.emojiDensity) },
    { name: 'list_format', values: postMetrics.map((m) => m.listFormatFrequency) },
    { name: 'reading_level', values: postMetrics.map((m) => m.readingLevel) },
  ];

  const engagementCorrelations = attributes
    .map((attr) => ({
      attribute: attr.name,
      correlation: pearsonCorrelation(attr.values, engagements),
    }))
    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  return { metrics, engagementCorrelations };
}

// ---- Utility functions ----

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const vowelGroups = word.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (word.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3) return 0;

  const meanX = avg(x);
  const meanY = avg(y);

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

function emptyMetrics(): LinguisticMetrics {
  return {
    avgSentenceLength: 0,
    avgWordLength: 0,
    vocabularyDiversity: 0,
    readingLevel: 0,
    avgPostLength: 0,
    questionFrequency: 0,
    exclamationFrequency: 0,
    emojiDensity: 0,
    listFormatFrequency: 0,
    paragraphCount: 0,
    hashtagUsage: 0,
  };
}

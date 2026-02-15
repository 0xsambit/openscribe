// ============================================
// OpenScripe Shared Types
// ============================================

// ---- Enums ----

export enum AiProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq',
  OLLAMA = 'ollama',
  CUSTOM = 'custom',
}

export enum StrategyType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CAMPAIGN = 'campaign',
}

export enum PostStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

export enum JobType {
  ANALYZE_POSTS = 'analyze_posts',
  GENERATE_STRATEGY = 'generate_strategy',
  GENERATE_CONTENT = 'generate_content',
  GENERATE_EMBEDDINGS = 'generate_embeddings',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// ---- User ----

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio?: string;
  linkedinUrl?: string;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  writingStyle?: StyleProfile;
  preferredTopics?: string[];
  tonePreference?: string;
  postingFrequency?: number;
  targetAudience?: string;
}

// ---- Auth ----

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

// ---- API Keys ----

export interface ApiKeyConfig {
  id: string;
  provider: AiProvider;
  modelName: string;
  isActive: boolean;
  maskedKey: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  provider: AiProvider;
  apiKey: string;
  modelName: string;
}

export interface UpdateApiKeyRequest {
  apiKey?: string;
  modelName?: string;
  isActive?: boolean;
}

// ---- LinkedIn Posts ----

export interface LinkedInPost {
  id: string;
  postText: string;
  postUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  postedAt: string;
  topics: string[];
  sentimentScore?: number;
  createdAt: string;
}

export interface PostUploadResult {
  totalParsed: number;
  totalImported: number;
  duplicatesSkipped: number;
  errors: string[];
}

// ---- Analysis ----

export interface StyleProfile {
  avgSentenceLength: number;
  vocabularyDiversity: number;
  readingLevel: number;
  toneDistribution: {
    professional: number;
    casual: number;
    motivational: number;
    storytelling: number;
  };
  structuralPatterns: {
    questionUsage: number;
    listFormatFrequency: number;
    emojiDensity: number;
    avgPostLength: number;
    hookPatterns: string[];
    ctaPatterns: string[];
  };
  engagementCorrelations: {
    attribute: string;
    correlation: number;
  }[];
  summary: string;
}

export interface TopicAnalysis {
  topics: TopicCluster[];
  totalPostsAnalyzed: number;
}

export interface TopicCluster {
  label: string;
  keywords: string[];
  postCount: number;
  avgEngagement: number;
  trend: 'rising' | 'stable' | 'declining';
}

// ---- Strategy ----

export interface ContentStrategy {
  id: string;
  strategyType: StrategyType;
  themes: StrategyTheme[];
  postingFrequency: number;
  targetAudience: TargetAudience;
  goals: StrategyGoals;
  generatedAt: string;
  expiresAt: string;
}

export interface StrategyTheme {
  topic: string;
  postType: 'educational' | 'storytelling' | 'opinion' | 'case_study' | 'how_to' | 'list';
  dayOfWeek: number;
  prompt: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TargetAudience {
  description: string;
  industries: string[];
  roles: string[];
  interests: string[];
}

export interface StrategyGoals {
  primary: 'thought_leadership' | 'lead_generation' | 'community_building' | 'brand_awareness';
  secondary?: string[];
  kpis?: string[];
}

export interface GenerateStrategyRequest {
  strategyType: StrategyType;
  postingFrequency: number;
  targetAudience: TargetAudience;
  goals: StrategyGoals;
}

// ---- Generated Content ----

export interface GeneratedPost {
  id: string;
  strategyId?: string;
  postText: string;
  topic: string;
  hook: string;
  cta: string;
  generationMetadata: GenerationMetadata;
  status: PostStatus;
  userFeedback?: string;
  feedbackRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationMetadata {
  model: string;
  provider: AiProvider;
  temperature: number;
  promptTokens: number;
  completionTokens: number;
  similarPostIds: string[];
}

export interface GenerateContentRequest {
  strategyId?: string;
  topic: string;
  postType?: string;
  additionalGuidance?: string;
  count?: number;
}

export interface SubmitFeedbackRequest {
  rating: number;
  feedback?: string;
}

// ---- Jobs ----

export interface Job {
  id: string;
  jobType: JobType;
  status: JobStatus;
  progress?: number;
  resultData?: unknown;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

// ---- Analytics ----

export interface EngagementMetrics {
  totalPosts: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  engagementRate: number;
  topPerformingPosts: LinkedInPost[];
  trend: { date: string; engagement: number }[];
}

export interface TopicPerformance {
  topic: string;
  postCount: number;
  avgEngagement: number;
  bestPost: LinkedInPost;
}

// ---- API Response Wrappers ----

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

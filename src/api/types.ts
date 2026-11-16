/** 与后端 `docs/API接口清单-20260814.md` 对应的精简类型定义 */

export interface Envelope<T> {
  code: number;
  message: string;
  data: T;
  requestId?: string;
}

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  role: "personal" | "enterprise" | "admin";
}

export interface LoginResult {
  accessToken: string;
  expiresAt: number;
  user: UserInfo;
}

export interface OverviewSummary {
  jobCount: number;
  postingCount: number;
  skillCount: number;
  snapshotCount: number;
  timePeriodCount: number;
  relationCount: number;
  nodeCount: number;
  datasetCount: number;
  pendingReviewCount: number;
  reportCount: number;
  updatedAt: string;
  governanceVersion: string;
  graphVersion: string;
}

export interface JobSkill {
  id?: string;
  name: string;
  weight: number;
  confidence: string;
}

export interface CityMetric {
  city: string;
  postingCount: number;
  share: number;
  salaryMedian: number;
  salaryRangeMin: number;
  salaryRangeMax: number;
  salarySampleCount: number;
}

export interface JobSummary {
  id: string;
  name: string;
  field: string;
  postingCount: number;
  sourceCount?: string | number;
  firstSeen?: string;
  lastSeen?: string;
  trendLabel?: string;
  trendDirection?: "up" | "down" | "flat" | string;
  skills: JobSkill[];
  trendChangePp?: number;
  trendWindow?: string;
  marketScope?: string;
  topCities?: CityMetric[];
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  city?: string;
  source?: string;
  url?: string;
  education?: string;
  experience?: string;
}

export interface JobDetail extends JobSummary {
  aliases?: string[];
  salaryBuckets?: Array<{ label: string; count: number; share: number }>;
  cityMetrics?: CityMetric[];
  postings?: JobPosting[];
}

export interface PageData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface FavoriteJob {
  id: string;
  roleId: string;
  roleName: string;
  createdAt?: string;
}

export interface HealthStatus {
  status: string;
  neo4j: boolean;
  mysql: boolean;
  agentProvider: string;
  agentConfigured: boolean;
}

/* ============ 职业助手智能体 ============ */

export type AgentMode = "career_planning" | "ability_analysis";

export interface AgentSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

export interface AgentEvidenceItem {
  sourceRecord?: string;
  url?: string;
  period?: string;
  snippet?: string;
  confidence?: string;
}

export interface AgentHistoryMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  evidence?: AgentEvidenceItem[];
  createdAt?: string;
}

export interface AgentChatPayload {
  agentMode: AgentMode;
  message: string;
  sessionId?: string;
  reportId?: string;
  roleId?: string;
  roleName?: string;
}

export interface AgentChatDone {
  sessionId: string;
  modelAvailable: boolean;
  providerAvailable?: boolean;
  provider?: string;
  providerReason?: string;
  cached?: boolean;
}

/* ============ AI 模拟面试 ============ */

export interface InterviewStartPayload {
  roleId: string;
  resumeId?: string;
  selfIntro?: string;
  questionCount?: number;
}

export interface InterviewQuestion {
  index: number;
  question: string;
  focus: string;
  answered: boolean;
  answer?: string;
  feedback?: string;
  score?: number | null;
  referencePoints?: string[];
}

export interface InterviewReport {
  overallScore: number;
  summary: string;
  dimensions?: Array<{ name: string; score: number; comment?: string }>;
  strengths?: string[];
  improvements?: string[];
  suggestions?: string[];
  provider?: string;
}

export interface InterviewSessionState {
  id: string;
  roleId: string;
  roleName: string;
  status: "in_progress" | "finished" | "completed";
  currentIndex: number;
  totalCount: number;
  questions: InterviewQuestion[];
  report: InterviewReport | null;
  selfIntro?: string;
  createdAt?: string;
}

export interface InterviewAnswerResult {
  feedback: string;
  score: number | null;
  referencePoints: string[];
  nextQuestion: { index: number; question: string; focus: string } | null;
  status: "in_progress" | "finished" | "completed";
  transcript?: string;
}

/* ============ 能力诊断（人岗匹配） ============ */

export interface MatchSkillGap {
  skillId?: string;
  skill: string;
  status: "matched" | "partial" | "missing";
  level?: string;
  importance?: string;
  jobEvidence?: string;
  sourceUrls?: string[];
}

export interface MatchDimension {
  name: string;
  weight?: number;
  score: number;
}

export interface MatchProfile {
  provided?: string;
  providedRank?: number;
  required?: string;
  requiredRank?: number;
  current?: string;
  target?: string;
  matchScore?: number;
  evidenceCount?: number;
  providedYears?: number;
  requiredYears?: number;
}

export interface MatchResult {
  reportId: string;
  roleId: string;
  roleName: string;
  score: number;
  skillScore?: number;
  breadthScore?: number;
  workStyleScore?: number;
  dimensions: MatchDimension[];
  gaps: MatchSkillGap[];
  notice?: string;
  educationProfile?: MatchProfile | null;
  experienceProfile?: MatchProfile | null;
  radarTargets?: Record<string, number>;
}

export interface RecommendItem {
  roleId: string;
  roleName: string;
  score: number;
  topGaps: string[];
}

export interface LearningStage {
  stage?: number;
  name?: string;
  duration?: string;
  estimatedHoursPerWeek?: number;
  goal?: string;
  skills?: string[];
  prerequisites?: string;
  courses?: Array<Record<string, unknown> | string>;
  certificates?: string[];
  weeklyTasks?: Array<{ period?: string; title?: string; actions?: string[]; deliverable?: string }>;
  practiceProject?: string;
  acceptanceCriteria?: string;
  outcome?: string;
  planVersion?: string;
}

export interface LearningPath {
  id: string;
  reportId: string;
  stages: LearningStage[];
}

/* ============ 个人简历 ============ */

export interface ResumeSkill {
  skill_id?: string;
  skill_name: string;
  evidence?: string;
  confidence?: string;
}

export interface ResumeResult {
  resumeId: string;
  skills: ResumeSkill[];
  education: string;
  experienceYears?: number | null;
  certificates: string[];
  warnings?: string[];
  ocr?: string | null;
  confirmed: boolean;
  fileName?: string;
  uploadedAt?: string;
  textPreview?: string;
}

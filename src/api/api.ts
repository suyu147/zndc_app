/**
 * 业务接口层：与后端 `职能洞察` 的 API 一一对应
 * 接口清单参见后端项目 docs/API接口清单-20260814.md（本文件不依赖后端代码，仅按 HTTP 合同调用）
 */
import { get, post, patch, del } from "./request";
import type {
  HealthStatus,
  LoginResult,
  OverviewSummary,
  PageData,
  JobSummary,
  JobDetail,
  FavoriteJob,
  AgentSessionSummary,
  AgentHistoryMessage,
  AgentMode,
  InterviewStartPayload,
  InterviewSessionState,
  InterviewAnswerResult,
  InterviewReport,
  MatchResult,
  RecommendItem,
  LearningPath,
} from "./types";

export type Portal = "personal" | "enterprise" | "admin";

export const api = {
  /** 健康检查（无需登录） */
  health: () => get<HealthStatus>("/health", undefined, { auth: false }),

  /** 登录：三端入口 personal / enterprise / admin */
  login: (username: string, password: string, portal: Portal) =>
    post<LoginResult>("/auth/login", { username, password, portal }, { auth: false }),

  /** 数据总览 */
  getOverview: () => get<OverviewSummary>("/overview"),

  /** 岗位列表：支持关键词、分页、城市过滤 */
  getJobs: (params: {
    keyword?: string;
    location?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => get<PageData<JobSummary>>("/jobs", params),

  /** 岗位详情 */
  getJob: (roleId: string, location?: string) =>
    get<JobDetail>(`/jobs/${encodeURIComponent(roleId)}`, location ? { location } : undefined),

  /** 我的收藏 */
  getFavorites: (limit = 100) => get<{ items: FavoriteJob[]; total: number }>("/me/favorites", { limit }),

  /** 加入收藏 */
  addFavorite: (roleId: string) => post<FavoriteJob>("/me/favorites", { roleId }),

  /** 取消收藏 */
  removeFavorite: (roleId: string) =>
    del<{ roleId: string; deleted: boolean }>(`/me/favorites/${encodeURIComponent(roleId)}`),

  /* ================= 职业助手智能体 ================= */

  /** 会话列表 */
  getAgentSessions: (limit = 50) =>
    get<{ items: AgentSessionSummary[]; total: number }>("/agent/sessions", { limit }),

  /** 会话详情（含历史消息） */
  getAgentSession: (id: string) =>
    get<AgentSessionSummary & { messages: AgentHistoryMessage[] }>(`/agent/sessions/${encodeURIComponent(id)}`),

  /** 会话改名 */
  renameAgentSession: (id: string, title: string) =>
    patch<AgentSessionSummary>(`/agent/sessions/${encodeURIComponent(id)}`, { title }),

  /** 删除会话 */
  deleteAgentSession: (id: string) => del<{ deleted: boolean }>(`/agent/sessions/${encodeURIComponent(id)}`),

  /* ================= AI 模拟面试 ================= */

  /** 开始一场新面试（服务端会基于岗位+自我介绍生成题目） */
  startInterview: (payload: InterviewStartPayload) =>
    post<InterviewSessionState>("/interview/start", payload, { timeout: 180000 }),

  /** 面试会话详情 */
  getInterview: (id: string) =>
    get<InterviewSessionState>(`/interview/sessions/${encodeURIComponent(id)}`, undefined, { timeout: 60000 }),

  /** 提交当前题目答案 */
  answerInterview: (id: string, answer: string) =>
    post<InterviewAnswerResult>(`/interview/${encodeURIComponent(id)}/answer`, { answer }, { timeout: 180000 }),

  /** 生成面试报告 */
  interviewReport: (id: string) =>
    post<InterviewReport>(`/interview/${encodeURIComponent(id)}/report`, null, { timeout: 300000 }),

  /* ================= 能力诊断（人岗匹配） ================= */

  /** 手动技能匹配：返回诊断报告 + reportId（可附带已上传简历 resumeId 便于追溯） */
  matchManual: (payload: {
    targetRoleId: string;
    skills: string[];
    education: string;
    experienceYears: number;
    certificates?: string[];
    workStyleScore?: number;
    resumeId?: string;
  }) => post<MatchResult>("/matching/manual", payload, { timeout: 120000 }),

  /** 根据已掌握技能推荐岗位 */
  recommendRoles: (skills: string[]) =>
    post<{ items: RecommendItem[]; total: number }>("/matching/recommendations", { skills, limit: 8 }),

  /** 生成 / 刷新学习路径 */
  createLearningPath: (reportId: string) =>
    post<LearningPath>(`/learning-paths?reportId=${encodeURIComponent(reportId)}`, null, { timeout: 180000 }),

  /** 助理解读上下文模式 */
  agentMode: (mode: AgentMode) => mode,
};

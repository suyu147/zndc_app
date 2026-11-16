/**
 * HR 端（招聘方 / B 端）领域模型
 *
 * 说明：当前 HR 端为纯前端实现，数据由 src/hr/mock.ts 提供，
 * 结构与未来接入真实后端接口保持一致，替换 src/hr/api.ts 内部实现即可无缝切换。
 */

/* ==================== 职位 ==================== */

/** 职位状态：招聘中 / 已暂停 / 已关闭 / 草稿 */
export type PositionStatus = "open" | "paused" | "closed" | "draft";

export const POSITION_STATUS_TEXT: Record<PositionStatus, string> = {
  open: "招聘中",
  paused: "已暂停",
  closed: "已关闭",
  draft: "草稿",
};

export interface PositionStats {
  /** 曝光量 */
  views: number;
  /** 投递数 */
  applicants: number;
  /** 筛选通过 */
  screening: number;
  /** 面试中 */
  interviewing: number;
  /** 已发 offer */
  offered: number;
  /** 已入职 */
  hired: number;
}

export interface HrPosition {
  id: string;
  /** 职位名称 */
  title: string;
  /** 所属领域 */
  field: string;
  /** 工作城市 */
  city: string;
  /** 薪资下限（K/月） */
  salaryMin: number;
  /** 薪资上限（K/月） */
  salaryMax: number;
  /** 经验要求，如「3-5年」 */
  experience: string;
  /** 学历要求，如「本科」 */
  education: string;
  /** 招聘人数 */
  headcount: number;
  /** 已招人数 */
  hiredCount: number;
  status: PositionStatus;
  /** 急聘 */
  urgent: boolean;
  /** 发布时间 YYYY-MM-DD */
  publishedAt: string;
  /** 更新时间 YYYY-MM-DD */
  updatedAt: string;
  stats: PositionStats;
  /** 技能要求 */
  skills: string[];
  /** 职位描述 */
  jd: string[];
  /** 平台数据：该岗位市场热度变化（百分点） */
  trendPp: number;
  /** 平台数据：市场中位薪资（K/月） */
  marketSalary: number;
  /** 平台数据：人才供需指数，<1 供大于求，>1 供不应求 */
  supplyIndex: number;
  /** 面试官 */
  owner: string;
}

/* ==================== 候选人 ==================== */

/** 候选人所处招聘阶段 */
export type CandidateStage =
  | "new" // 新投递
  | "screening" // 筛选中
  | "interview" // 面试中
  | "offer" // 已发 offer
  | "hired" // 已入职
  | "rejected"; // 已淘汰

export const CANDIDATE_STAGE_TEXT: Record<CandidateStage, string> = {
  new: "新投递",
  screening: "筛选中",
  interview: "面试中",
  offer: "已发 Offer",
  hired: "已入职",
  rejected: "已淘汰",
};

/** 招聘流程主链路（不含淘汰） */
export const CANDIDATE_FLOW: CandidateStage[] = ["new", "screening", "interview", "offer", "hired"];

export interface MatchDimension {
  /** 维度名 */
  name: string;
  /** 得分 0-100 */
  score: number;
  /** 权重说明 */
  weight?: number;
  /** 一句话点评 */
  comment?: string;
}

export interface Candidate {
  id: string;
  name: string;
  gender: "男" | "女";
  age: number;
  phone: string;
  email: string;
  /** 学历 */
  education: string;
  school: string;
  major: string;
  /** 工作年限 */
  experienceYears: number;
  currentTitle: string;
  currentCompany: string;
  expectSalary: string;
  expectCity: string;
  /** 应聘职位 id */
  positionId: string;
  positionTitle: string;
  stage: CandidateStage;
  /** 人岗匹配度 0-100 */
  matchScore: number;
  /** 候选人技能 */
  skills: string[];
  /** 与 JD 匹配的技能 */
  matchedSkills: string[];
  /** JD 要求但缺失的技能 */
  missingSkills: string[];
  /** 匹配维度明细 */
  dimensions: MatchDimension[];
  /** AI 综合评价 */
  aiSummary: string;
  /** AI 优势点 */
  aiPros: string[];
  /** AI 风险点 */
  aiCons: string[];
  /** 投递时间 YYYY-MM-DD HH:mm */
  appliedAt: string;
  /** 来源渠道 */
  source: string;
  /** 简历亮点 */
  highlights: string[];
  /** AI 面试得分（未面试则为空） */
  interviewScore?: number;
  /** 最近一次沟通摘要 */
  lastContact?: string;
}

/* ==================== 面试 ==================== */

export type InterviewType = "AI 面试" | "视频面试" | "现场面试" | "电话面试";
export type InterviewStatus = "pending" | "finished" | "cancelled";

export const INTERVIEW_STATUS_TEXT: Record<InterviewStatus, string> = {
  pending: "待进行",
  finished: "已完成",
  cancelled: "已取消",
};

export interface InterviewReport {
  overallScore: number;
  summary: string;
  dimensions: Array<{ name: string; score: number }>;
  strengths: string[];
  improvements: string[];
  /** 面试建议 */
  suggestion: string;
}

export interface InterviewRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  positionId: string;
  positionTitle: string;
  type: InterviewType;
  /** 安排时间 YYYY-MM-DD HH:mm */
  scheduledAt: string;
  durationMin: number;
  status: InterviewStatus;
  /** 面试官 */
  interviewer: string;
  score?: number;
  report?: InterviewReport;
}

/* ==================== 沟通消息 ==================== */

export interface ChatMessage {
  id: string;
  /** me = HR 自己 */
  from: "me" | "candidate";
  content: string;
  time: string;
}

export interface HrMessage {
  id: string;
  candidateId: string;
  candidateName: string;
  positionTitle: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: ChatMessage[];
}

/* ==================== 招聘洞察 ==================== */

export interface HotRole {
  supplyIndex?: number;
  rank: number;
  name: string;
  field: string;
  /** 热度指数 0-100 */
  heat: number;
  /** 环比变化（百分点） */
  trendPp: number;
  /** 市场中位薪资 K */
  salaryMedian: number;
  /** 在招帖子数 */
  postingCount: number;
}

export interface SalaryBucket {
  label: string;
  count: number;
}

export interface CityDistribution {
  city: string;
  count: number;
  salary: number;
}

export interface SkillDemand {
  name: string;
  /** 需求占比 % */
  demand: number;
  /** 同比增长 % */
  growth: number;
}

export interface TrendPoint {
  month: string;
  /** 招聘需求量 */
  value: number;
}

export interface InsightData {
  /** 更新时间 */
  updatedAt: string;
  hotRoles: HotRole[];
  salaryBuckets: SalaryBucket[];
  cities: CityDistribution[];
  skills: SkillDemand[];
  trend: TrendPoint[];
  /** 全站平均供需指数 */
  supplyIndex: number;
  /** 平均招聘周期（天） */
  avgCycleDays: number;
}

/* ==================== 工作台 ==================== */

export interface TodoItem {
  key: string;
  label: string;
  count: number;
  icon: string;
  color: string;
  /** 点击跳转目标 */
  target: string;
}

export interface WorkbenchData {
  companyName: string;
  hrName: string;
  dateLabel: string;
  todos: TodoItem[];
  /** 在招职位数 */
  openPositions: number;
  /** 本月投递 */
  monthApplicants: number;
  /** 面试中 */
  interviewing: number;
  /** 已入职 */
  hired: number;
  funnel: Array<{ label: string; value: number; color: string }>;
  /** AI 推荐候选人 */
  recommendCandidates: Candidate[];
  /** 在招职位进度 */
  positionProgress: Array<{
    id: string;
    title: string;
    hiredCount: number;
    headcount: number;
    applicants: number;
    status: PositionStatus;
    urgent: boolean;
  }>;
  /** 今日日程（面试安排） */
  todaySchedule: InterviewRecord[];
}

/* ==================== 企业信息 ==================== */

export interface CompanyProfile {
  name: string;
  logoText: string;
  industry: string;
  scale: string;
  city: string;
  /** 认证状态 */
  verified: boolean;
  /** 公司简介 */
  intro: string;
  /** 招聘官 */
  hrName: string;
  hrTitle: string;
  /** 人才库数量 */
  talentPool: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  /** 在处理的职位数 */
  handling: number;
  active: boolean;
}

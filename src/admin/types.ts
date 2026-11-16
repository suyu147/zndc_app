/**
 * 治理管理员端领域模型
 *
 * 与后端 `docs/API接口清单-20260814.md` 中「管理台」章节的接口一一对应。
 * 所有响应均经过 request 层解包（{ code, message, data } → data），
 * 因此本文件只描述 data 字段的真实结构。
 */

/* ==================== 治理仪表盘 ==================== */

export interface DashboardGraph {
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
  entityCounts: Record<string, number>;
}

export interface DashboardDataAssets {
  datasetCount: number;
  totalRecords: number;
  boundaries: Record<string, number>;
  revisionStatuses: Record<string, number>;
  latestUpdatedAt: string;
}

export interface DashboardGovernance {
  draftStatuses: Record<string, number>;
  candidateTypes: Record<string, number>;
  versionStatuses: Record<string, number>;
  taskStatuses: Record<string, number>;
  funnel: Array<{ key: string; label: string; count: number; route: string }>;
}

export interface DashboardRisk {
  key: string;
  label: string;
  count: number;
  route: string;
}

export interface DashboardAction {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardSystem {
  api: boolean;
  neo4j: boolean;
  mysql: boolean;
  agentProvider: string;
  agentConfigured: boolean;
}

export interface DashboardData {
  generatedAt: string;
  governanceVersion: string;
  graphVersion: string;
  graph: DashboardGraph;
  dataAssets: DashboardDataAssets;
  governance: DashboardGovernance;
  monthlyEvidence: Array<{ period: string; postingCount: number }>;
  locations: string[];
  risks: DashboardRisk[];
  recentActions: DashboardAction[];
  system: DashboardSystem;
  quality?: {
    score: number;
    status: string;
    passedChecks: number;
    totalChecks: number;
  };
}

/* ==================== 数据资产（数据集） ==================== */

export type DatasetBoundary = "formal" | "review";
export type DatasetSyncStatus = "registered" | "pending" | "synced" | "failed" | "not_requested";

export interface DatasetItem {
  id: string;
  name: string;
  category: string;
  records: number;
  version: string;
  boundary: DatasetBoundary;
  path: string;
  sha256: string;
  syncStatus: DatasetSyncStatus;
  syncResult: Record<string, unknown> | null;
  updatedAt: string;
}

export interface DatasetRevision {
  id: string;
  fileName: string;
  path: string;
  records: number;
  version: string;
  sha256: string;
  syncStatus: DatasetSyncStatus;
  syncResult: Record<string, unknown> | null;
  createdAt: string;
}

export interface DatasetPage {
  items: DatasetItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateDatasetInput {
  name: string;
  filePath: string;
  category?: string;
  version?: string;
  boundary?: DatasetBoundary;
  syncGraph?: boolean;
}

export interface UpdateDatasetInput {
  name?: string;
  category?: string;
  version?: string;
  boundary?: DatasetBoundary;
}

/* ==================== 候选复核（岗位定义草稿） ==================== */

export type CandidateType = "new_role" | "skill_change" | "definition_update";
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewItem {
  id: string;
  roleId: string;
  roleName: string;
  candidateType: CandidateType;
  status: ReviewStatus;
  definition: ReviewDefinition;
  evidence: Array<Record<string, unknown>>;
  evidenceClass: "data_backed" | "curated" | "aggregated";
  evidenceLabel: string;
}

export interface ReviewSkill {
  skill_id?: string;
  skill_name?: string;
  name?: string;
  evidence?: string;
  evidence_count?: number;
  posting_penetration?: number;
}

export interface ReviewDefinition {
  first_seen?: string;
  latest_seen?: string;
  core_responsibilities?: string[];
  required_skills?: ReviewSkill[];
  bonus_skills?: ReviewSkill[];
  application_scenarios?: string[];
  posting_count?: number;
  source_count?: number;
  evidence_record_count?: number;
  signal_score?: number;
  publication_title?: string;
  source_type?: string;
  enterprise_name?: string;
  job_category?: string;
  role_family?: string;
  changes?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export type ReviewActionKind = "approve" | "reject" | "update";

export interface ReviewActionPayload {
  action: ReviewActionKind;
  note?: string;
  definition?: ReviewDefinition;
}

/* ==================== 图谱版本 ==================== */

export type VersionStatus = "approved" | "published" | "withdrawn" | "draft";

export interface GraphVersion {
  id: string;
  roleId: string;
  roleName: string;
  status: VersionStatus;
  candidateType: CandidateType;
  displayTitle: string;
  publishedAt: string | null;
  withdrawnAt: string | null;
  draftId: string;
  postingCount: number;
  sourceCount: number;
  evidenceCount: number;
  coreSkills: string[];
  definition: ReviewDefinition;
  evidence?: Array<Record<string, unknown>>;
}

export interface VersionList {
  items: GraphVersion[];
  total: number;
}

/* ==================== 数据质量 ==================== */

export interface QualityRule {
  name: string;
  passed: boolean;
}

export interface QualitySummary {
  generatedAt: string;
  score: number;
  status: string;
  pendingReviews: number;
  reviewDatasets: number;
  rules: string[];
  checks: QualityRule[];
  graph: DashboardGraph;
  migration: Record<string, unknown>;
  integrity: Record<string, unknown>;
  coverage: Record<string, unknown>;
  competitionEvidence: Record<string, unknown>;
  ocrEvaluation: Record<string, unknown>;
  trendAblation: Record<string, unknown>;
  evaluation: Record<string, unknown> | null;
}

/**
 * HR 端数据服务层
 *
 * 当前全部基于本地 store（Mock）实现，通过 delay 模拟网络往返，
 * 调用方无需区分「本地 / 远程」。接入真实后端时，只需把函数体替换为
 * `request<T>(...)` 调用即可，页面代码零改动。
 */

import { genId, hrState, markMessageRead, setCandidateStage, setPositionStatus, todayLabel, upsertPosition } from "./store";
import type {
  Candidate,
  CandidateStage,
  HrMessage,
  HrPosition,
  InsightData,
  InterviewRecord,
  InterviewStatus,
  PositionStatus,
  WorkbenchData,
} from "./types";

/** 模拟网络延迟 */
function delay<T>(payload: T, ms = 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(payload), ms));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/* ==================== 工作台 ==================== */

export function getWorkbench(): Promise<WorkbenchData> {
  const today = todayLabel();
  const { positions, candidates, interviews, company } = hrState;

  const openPositions = positions.filter((item) => item.status === "open");

  const pendingResumes = candidates.filter((item) => item.stage === "new").length;
  const todayInterviews = interviews.filter(
    (item) => item.status === "pending" && item.scheduledAt.startsWith(today),
  ).length;
  const pendingOffers = candidates.filter((item) => item.stage === "interview").length;
  const stalePositions = openPositions.filter((item) => item.updatedAt !== today).length;

  const sum = (key: keyof HrPosition["stats"]) =>
    positions.reduce((total, item) => total + item.stats[key], 0);

  const interviewing = candidates.filter((item) => item.stage === "interview").length;
  const hired = candidates.filter((item) => item.stage === "hired").length;

  const recommendCandidates = clone(
    candidates
      .filter((item) => item.stage === "new" || item.stage === "screening" || item.stage === "interview")
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5),
  );

  return delay({
    companyName: company.name,
    hrName: company.hrName,
    dateLabel: `${today} ${weekdayLabel()}`,
    todos: [
      { key: "resume", label: "待处理简历", count: pendingResumes, icon: "📄", color: "#FF7A45", target: "candidates" },
      { key: "interview", label: "今日面试", count: todayInterviews, icon: "🎤", color: "#00A6A5", target: "interviews" },
      { key: "offer", label: "待发 Offer", count: pendingOffers, icon: "🏅", color: "#8B5CF6", target: "offer" },
      { key: "refresh", label: "待刷新职位", count: stalePositions, icon: "🔄", color: "#3B82F6", target: "positions" },
    ],
    openPositions: openPositions.length,
    monthApplicants: sum("applicants"),
    interviewing,
    hired,
    funnel: [
      { label: "投递简历", value: sum("applicants"), color: "#00BEBD" },
      { label: "筛选通过", value: sum("screening"), color: "#38BDF8" },
      { label: "进入面试", value: sum("interviewing"), color: "#8B5CF6" },
      { label: "发放 Offer", value: sum("offered"), color: "#F59E0B" },
      { label: "成功入职", value: sum("hired"), color: "#2DA44E" },
    ],
    recommendCandidates,
    positionProgress: clone(
      openPositions
        .sort((a, b) => b.stats.applicants - a.stats.applicants)
        .slice(0, 4)
        .map((item) => ({
          id: item.id,
          title: item.title,
          hiredCount: item.hiredCount,
          headcount: item.headcount,
          applicants: item.stats.applicants,
          status: item.status,
          urgent: item.urgent,
        })),
    ),
    todaySchedule: clone(
      interviews
        .filter((item) => item.status === "pending" && item.scheduledAt.startsWith(today))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    ),
  });
}

function weekdayLabel(): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date().getDay()];
}

/* ==================== 职位 ==================== */

export function getPositions(status?: PositionStatus | "all"): Promise<HrPosition[]> {
  const list = !status || status === "all" ? hrState.positions : hrState.positions.filter((item) => item.status === status);
  return delay(clone(list));
}

export function getPosition(id: string): Promise<HrPosition | undefined> {
  return delay(clone(hrState.positions.find((item) => item.id === id)));
}

export function savePosition(position: HrPosition): Promise<HrPosition> {
  upsertPosition(position);
  return delay(clone(position), 300);
}

export function updatePositionStatus(id: string, status: PositionStatus): Promise<boolean> {
  setPositionStatus(id, status);
  return delay(true, 240);
}

/** 按职位拉取候选人 */
export function getPositionCandidates(positionId: string): Promise<Candidate[]> {
  return delay(clone(hrState.candidates.filter((item) => item.positionId === positionId)));
}

/* ==================== 候选人 ==================== */

export interface CandidateQuery {
  stage?: CandidateStage | "all";
  positionId?: string;
  keyword?: string;
  /** 最低匹配度 */
  minScore?: number;
  sort?: "match" | "latest";
}

export function getCandidates(query: CandidateQuery = {}): Promise<Candidate[]> {
  let list = hrState.candidates.slice();
  if (query.stage && query.stage !== "all") list = list.filter((item) => item.stage === query.stage);
  if (query.positionId) list = list.filter((item) => item.positionId === query.positionId);
  if (query.minScore) list = list.filter((item) => item.matchScore >= (query.minScore as number));
  if (query.keyword) {
    const kw = query.keyword.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        item.currentTitle.toLowerCase().includes(kw) ||
        item.currentCompany.toLowerCase().includes(kw) ||
        item.skills.some((skill) => skill.toLowerCase().includes(kw)),
    );
  }
  if (query.sort === "latest") list.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  else list.sort((a, b) => b.matchScore - a.matchScore);
  return delay(clone(list));
}

export function getCandidate(id: string): Promise<Candidate | undefined> {
  return delay(clone(hrState.candidates.find((item) => item.id === id)));
}

export function updateCandidateStage(id: string, stage: CandidateStage): Promise<boolean> {
  setCandidateStage(id, stage);
  return delay(true, 240);
}

/** 各阶段候选人数量（用于 Tab 角标） */
export function getStageCounts(): Record<CandidateStage | "all", number> {
  const counts = {
    all: hrState.candidates.length,
    new: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    hired: 0,
    rejected: 0,
  } as Record<CandidateStage | "all", number>;
  hrState.candidates.forEach((item) => {
    counts[item.stage] = (counts[item.stage] || 0) + 1;
  });
  return counts;
}

/* ==================== 面试 ==================== */

export type InterviewTab = "today" | "upcoming" | "finished";

export function getInterviews(tab: InterviewTab): Promise<InterviewRecord[]> {
  const today = todayLabel();
  let list = hrState.interviews.slice();
  if (tab === "today") {
    list = list.filter((item) => item.scheduledAt.startsWith(today) && item.status === "pending");
  } else if (tab === "upcoming") {
    list = list.filter((item) => item.status === "pending" && !item.scheduledAt.startsWith(today));
  } else {
    list = list.filter((item) => item.status !== "pending");
  }
  list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  if (tab === "finished") list.reverse();
  return delay(clone(list));
}

export function getInterviewCounts(): Record<InterviewTab, number> {
  const today = todayLabel();
  const list = hrState.interviews;
  return {
    today: list.filter((item) => item.scheduledAt.startsWith(today) && item.status === "pending").length,
    upcoming: list.filter((item) => item.status === "pending" && !item.scheduledAt.startsWith(today)).length,
    finished: list.filter((item) => item.status !== "pending").length,
  };
}

export function getInterviewByCandidate(candidateId: string): Promise<InterviewRecord[]> {
  return delay(clone(hrState.interviews.filter((item) => item.candidateId === candidateId)));
}

export function getInterview(id: string): Promise<InterviewRecord | undefined> {
  return delay(clone(hrState.interviews.find((item) => item.id === id)));
}

/* ==================== 沟通 ==================== */

export function getMessages(): Promise<HrMessage[]> {
  return delay(clone(hrState.messages));
}

export function getMessageThread(candidateId: string): Promise<HrMessage | undefined> {
  markMessageRead(
    (hrState.messages.find((item) => item.candidateId === candidateId) || { id: "" }).id,
  );
  return delay(clone(hrState.messages.find((item) => item.candidateId === candidateId)));
}

export function sendMessage(candidateId: string, content: string): Promise<boolean> {
  const thread = hrState.messages.find((item) => item.candidateId === candidateId);
  if (!thread) return delay(false);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  thread.messages.push({ id: genId("cm"), from: "me", content, time });
  thread.lastMessage = content;
  thread.time = time;
  return delay(true, 120);
}

/* ==================== 洞察 ==================== */

export function getInsight(): Promise<InsightData> {
  return delay(clone(hrState.insight));
}

/* ==================== 发布职位时的智能建议 ==================== */

export interface PositionAdvice {
  marketSalary: number;
  trendPp: number;
  supplyIndex: number;
  suggestedSkills: string[];
  /** 招聘难度描述 */
  difficulty: string;
  /** 建议招聘周期（天） */
  suggestedDays: number;
}

/** 基于岗位名称在洞察热度榜中查找，给出薪资与技能建议 */
export function getPositionAdvice(title: string): Promise<PositionAdvice | null> {
  const keyword = title.trim();
  if (!keyword) return delay(null, 80);

  const hit =
    hrState.insight.hotRoles.find((item) => item.name.includes(keyword) || keyword.includes(item.name)) ||
    hrState.insight.hotRoles.find((item) =>
      item.name.split(/[（(]/)[0].includes(keyword) || keyword.includes(item.name.split(/[（(]/)[0]),
    );

  const fallbackSalary = 30;
  const salary = hit?.salaryMedian ?? fallbackSalary;
  const trendPp = hit?.trendPp ?? 0;
  const supplyIndex = hit?.supplyIndex ?? hrState.insight.supplyIndex;

  const relatedSkills = hit
    ? hrState.insight.skills
        .filter((skill) => hit.field === "人工智能" || hit.field === "数据分析" ? skill.growth > 0 : true)
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 6)
        .map((skill) => skill.name)
    : hrState.insight.skills
        .sort((a, b) => b.demand - a.demand)
        .slice(0, 6)
        .map((skill) => skill.name);

  const difficulty =
    supplyIndex >= 1.8 ? "招聘难度高：人才稀缺，建议放宽年限或提高薪资上限" : supplyIndex >= 1.2 ? "招聘难度中等：竞争较激烈，建议突出技术亮点" : "招聘难度较低：人才供给充足";

  const suggestedDays = Math.round(hrState.insight.avgCycleDays * (supplyIndex > 1 ? supplyIndex : 1));

  return delay(
    {
      marketSalary: salary,
      trendPp,
      supplyIndex,
      suggestedSkills: relatedSkills,
      difficulty,
      suggestedDays,
    },
    260,
  );
}

/* ==================== 面试状态（导出给页面复用） ==================== */

export type { InterviewStatus };

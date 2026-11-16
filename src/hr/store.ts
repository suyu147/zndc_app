/**
 * HR 端运行时状态
 *
 * - 纯前端阶段以 Mock 数据播种，所有变更（推进候选人、上下线职位、发布职位…）写入 localStorage，
 *   保证 reLaunch / 页面跳转后状态不丢失，交互链路完整可演示。
 * - 未来接入真实后端时，仅需在 src/hr/api.ts 中改为调用接口并回写本 store。
 */

import { reactive, watch } from "vue";
import {
  MOCK_CANDIDATES,
  MOCK_COMPANY,
  MOCK_INSIGHT,
  MOCK_INTERVIEWS,
  MOCK_MESSAGES,
  MOCK_POSITIONS,
  MOCK_TEAM,
} from "./mock";
import type {
  Candidate,
  CandidateStage,
  CompanyProfile,
  HrMessage,
  HrPosition,
  InsightData,
  InterviewRecord,
  PositionStatus,
  TeamMember,
} from "./types";

const STORAGE_KEY = "zndc_hr_state_v2";

/** 时间基准：Mock 数据中「今天」对应的原始日期，用于把演示日程平移到真实当天 */
const SCHEDULE_BASE = "2026-09-03";

interface HrState {
  company: CompanyProfile;
  team: TeamMember[];
  positions: HrPosition[];
  candidates: Candidate[];
  interviews: InterviewRecord[];
  messages: HrMessage[];
  insight: InsightData;
  /** 日程时间基准，随数据一起持久化，保证多次打开都能正确平移 */
  scheduleBase: string;
}

function seed(): HrState {
  const state: HrState = {
    company: JSON.parse(JSON.stringify(MOCK_COMPANY)) as CompanyProfile,
    team: JSON.parse(JSON.stringify(MOCK_TEAM)) as TeamMember[],
    positions: JSON.parse(JSON.stringify(MOCK_POSITIONS)) as HrPosition[],
    candidates: JSON.parse(JSON.stringify(MOCK_CANDIDATES)) as Candidate[],
    interviews: JSON.parse(JSON.stringify(MOCK_INTERVIEWS)) as InterviewRecord[],
    messages: JSON.parse(JSON.stringify(MOCK_MESSAGES)) as HrMessage[],
    insight: JSON.parse(JSON.stringify(MOCK_INSIGHT)) as InsightData,
    scheduleBase: SCHEDULE_BASE,
  };
  normalizeSchedule(state);
  return state;
}

/**
 * 把面试日程相对「今天」平移。
 * Mock 里今天=2026-09-03、明天=09-04 …，按真实当前日期整体偏移，
 * 保证「今日日程 / 待进行面试」在任何一天打开都能呈现出合理的内容。
 */
function normalizeSchedule(state: HrState): void {
  const base = parseDay(state.scheduleBase || SCHEDULE_BASE);
  const today = parseDay(todayLabel());
  const offsetDays = Math.round((today - base) / 86400000);
  if (!Number.isFinite(offsetDays) || offsetDays === 0) return;
  state.interviews.forEach((item) => {
    item.scheduledAt = shiftDateTime(item.scheduledAt, offsetDays);
  });
  state.scheduleBase = todayLabel();
}

function parseDay(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

/** 支持「YYYY-MM-DD」与「YYYY-MM-DD HH:mm」两种格式 */
function shiftDateTime(value: string, days: number): string {
  if (!value) return value;
  const [datePart, timePart] = value.split(" ");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return value;
  const shifted = new Date(y, m - 1, d + days);
  const mm = String(shifted.getMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getDate()).padStart(2, "0");
  return `${shifted.getFullYear()}-${mm}-${dd}${timePart ? ` ${timePart}` : ""}`;
}

function load(): HrState {
  let restored: HrState | null = null;
  try {
    const raw = uni.getStorageSync(STORAGE_KEY) as string;
    if (raw) {
      const parsed = JSON.parse(raw) as HrState;
      // 结构性校验：字段齐全才采用缓存，避免旧版本残留导致页面崩溃
      if (parsed?.positions?.length && parsed?.candidates?.length && parsed?.insight) {
        restored = parsed;
      }
    }
  } catch {
    /* 缓存损坏则回落到 Mock */
  }
  const state = restored || seed();
  if (restored) normalizeSchedule(state);
  return state;
}

export const hrState: HrState = reactive(load());

let persistTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  hrState,
  () => {
    // 合并高频写入，避免连续操作时重复序列化
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      try {
        uni.setStorageSync(STORAGE_KEY, JSON.stringify(hrState));
      } catch {
        /* 存储配额不足时忽略 */
      }
    }, 120);
  },
  { deep: true },
);

/** 恢复出厂数据（企业中心「重置演示数据」用） */
export function resetHrState(): void {
  const fresh = seed();
  hrState.company = fresh.company;
  hrState.team = fresh.team;
  hrState.positions = fresh.positions;
  hrState.candidates = fresh.candidates;
  hrState.interviews = fresh.interviews;
  hrState.messages = fresh.messages;
  hrState.insight = fresh.insight;
  hrState.scheduleBase = fresh.scheduleBase;
}

/* ==================== 变更操作 ==================== */

export function setPositionStatus(id: string, status: PositionStatus): void {
  const target = hrState.positions.find((item) => item.id === id);
  if (target) {
    target.status = status;
    target.updatedAt = todayLabel();
  }
}

export function upsertPosition(position: HrPosition): void {
  const index = hrState.positions.findIndex((item) => item.id === position.id);
  if (index >= 0) hrState.positions[index] = position;
  else hrState.positions.unshift(position);
}

export function setCandidateStage(id: string, stage: CandidateStage): void {
  const target = hrState.candidates.find((item) => item.id === id);
  if (target) target.stage = stage;
}

export function addMessage(candidateId: string, content: string): void {
  const thread = hrState.messages.find((item) => item.candidateId === candidateId);
  if (!thread) return;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  thread.messages.push({
    id: `cm_${Date.now()}`,
    from: "me",
    content,
    time,
  });
  thread.lastMessage = content;
  thread.time = time;
}

export function markMessageRead(id: string): void {
  const thread = hrState.messages.find((item) => item.id === id);
  if (thread) thread.unread = 0;
}

/* ==================== 工具 ==================== */

export function todayLabel(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

let idSeed = Date.now();
export function genId(prefix: string): string {
  idSeed += 1;
  return `${prefix}_${idSeed.toString(36)}`;
}

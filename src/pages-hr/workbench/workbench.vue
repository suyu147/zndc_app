<template>
  <view class="hr-page">
    <hr-navbar title="">
      <template #left>
        <view class="nav-brand">
          <hr-avatar :name="data?.companyName || '星'" :size="52" square />
          <view class="nav-brand-text">
            <text class="nav-brand-name">{{ shortCompany }}</text>
            <text class="nav-brand-sub">招聘工作台</text>
          </view>
        </view>
      </template>
      <template #right>
        <view class="nav-bell" @tap="goMessages" role="button" tabindex="0" @keydown.enter.prevent.stop="goMessages" @keydown.space.prevent.stop="goMessages">
          <svg aria-hidden="true" viewBox="0 0 24 24" class="nav-bell-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8.6a6 6 0 1 0-12 0c0 5.2-2 6.9-2 6.9h16s-2-1.7-2-6.9" />
            <path d="M13.7 19.4a2 2 0 0 1-3.4 0" />
          </svg>
          <view v-if="unreadTotal" class="nav-bell-dot">{{ unreadTotal }}</view>
        </view>
      </template>
    </hr-navbar>

    <!-- 今日招聘待办 -->
    <view class="hero">
      <view class="hero-greeting">
        <text class="hero-hi">{{ greeting }}，{{ data?.hrName || "招聘官" }}</text>
        <text class="hero-sub">{{ data?.dateLabel || "" }}　今日有 {{ todoTotal }} 项待办需要处理</text>
      </view>

      <!-- 待办四宫格 -->
      <view class="todo-card">
        <view
          v-for="todo in data?.todos || []"
          :key="todo.key"
          class="todo-item"
          @tap="onTodo(todo)"
         role="button" tabindex="0" @keydown.enter.prevent.stop="onTodo(todo)" @keydown.space.prevent.stop="onTodo(todo)">
          <view class="todo-icon"><AppIcon :name="({ resume: 'file', interview: 'calendar', offer: 'check', refresh: 'refresh' } as Record<string, string>)[todo.key] || 'briefcase'" /></view>
          <view class="todo-count">
            {{ todo.count }}
          </view>
          <view class="todo-label">{{ todo.label }}</view>
        </view>
      </view>
    </view>

    <view v-if="loading && !data" class="hr-loading">加载中…</view>

    <template v-if="data">
      <!-- 核心招聘数据 -->
      <view class="stat-grid">
        <view class="stat-cell">
          <text class="stat-value">{{ data.openPositions }}</text>
          <text class="stat-label">在招职位</text>
        </view>
        <view class="stat-cell">
          <text class="stat-value">{{ data.monthApplicants }}</text>
          <text class="stat-label">累计投递</text>
        </view>
        <view class="stat-cell">
          <text class="stat-value">{{ data.interviewing }}</text>
          <text class="stat-label">面试中</text>
        </view>
        <view class="stat-cell">
          <text class="stat-value">{{ data.hired }}</text>
          <text class="stat-label">已入职</text>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="hr-card">
        <view class="hr-sec-title"><text class="hr-sec-title-main">快捷入口</text></view>
        <view class="quick-grid">
          <view v-for="item in QUICK_ACTIONS" :key="item.label" class="quick-item" @tap="item.action()" role="button" tabindex="0" @keydown.enter.prevent.stop="item.action()" @keydown.space.prevent.stop="item.action()">
            <view class="quick-icon">
              <svg aria-hidden="true"
                v-if="item.key === 'publish'"
                viewBox="0 0 24 24"
                class="quick-ico"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="2.5" y="7" width="19" height="13.5" rx="2.6" />
                <path d="M8.5 7V5.4A1.9 1.9 0 0 1 10.4 3.5h3.2A1.9 1.9 0 0 1 15.5 5.4V7" />
                <path d="M12 11.2v4.2M9.9 13.3h4.2" />
              </svg>
              <svg aria-hidden="true"
                v-if="item.key === 'talent'"
                viewBox="0 0 24 24"
                class="quick-ico"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4.5-4.5" />
              </svg>
              <svg aria-hidden="true"
                v-if="item.key === 'interview'"
                viewBox="0 0 24 24"
                class="quick-ico"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="5" width="18" height="16" rx="2.6" />
                <path d="M3 10h18M8 3v4M16 3v4" />
                <path d="M8.6 14.4l2 2 4-4" />
              </svg>
              <svg aria-hidden="true"
                v-if="item.key === 'insight'"
                viewBox="0 0 24 24"
                class="quick-ico"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 20.8h18" />
                <rect x="4.6" y="11.5" width="3.6" height="6.4" rx="1.3" />
                <rect x="10.2" y="6.5" width="3.6" height="11.4" rx="1.3" />
                <rect x="15.8" y="14.4" width="3.6" height="3.5" rx="1.3" />
              </svg>
            </view>
            <text class="quick-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐候选人 -->
      <view v-if="data.recommendCandidates.length" class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">AI 推荐候选人</text>
          <text class="hr-sec-more" @tap="goCandidates" role="button" tabindex="0" @keydown.enter.prevent.stop="goCandidates" @keydown.space.prevent.stop="goCandidates">全部 ›</text>
        </view>
        <view class="rec-scroll">
          <view class="rec-track">
            <view
              v-for="candidate in data.recommendCandidates"
              :key="candidate.id"
              class="rec-row"
              @tap="openCandidate(candidate.id)"
             role="button" tabindex="0" @keydown.enter.prevent.stop="openCandidate(candidate.id)" @keydown.space.prevent.stop="openCandidate(candidate.id)">
              <view class="rec-top">
                <hr-avatar :name="candidate.name" :size="80" />
                <text class="rec-score">{{ candidate.matchScore }}<text class="rec-score-label">% 匹配</text></text>
              </view>
              <view class="rec-name">{{ candidate.name }}</view>
              <view class="rec-meta">{{ candidate.experienceYears }}年　{{ candidate.education }}</view>
              <view class="rec-meta rec-company">{{ candidate.currentTitle }}</view>
              <view class="rec-pos">{{ candidate.positionTitle }}</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 在招职位进度 -->
      <view v-if="data.positionProgress.length" class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">在招职位进度</text>
          <text class="hr-sec-more" @tap="goPositions" role="button" tabindex="0" @keydown.enter.prevent.stop="goPositions" @keydown.space.prevent.stop="goPositions">管理 ›</text>
        </view>
        <view
          v-for="position in data.positionProgress"
          :key="position.id"
          class="prog-item"
          @tap="openPosition(position.id)"
         role="button" tabindex="0" @keydown.enter.prevent.stop="openPosition(position.id)" @keydown.space.prevent.stop="openPosition(position.id)">
          <view class="prog-head">
            <view class="prog-title-wrap">
              <text class="prog-title">{{ position.title }}</text>
              <view v-if="position.urgent" class="hr-badge hr-badge--urgent">急聘</view>
            </view>
            <text class="prog-count">{{ position.hiredCount }}/{{ position.headcount }} 人</text>
          </view>
          <view class="prog-track">
            <view class="prog-bar" :style="{ width: progressWidth(position) + '%' }"></view>
          </view>
          <view class="prog-foot">
            <text>简历 {{ position.applicants }}</text>
            <text>招聘中</text>
          </view>
        </view>
      </view>

      <!-- 招聘漏斗 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">招聘漏斗</text>
          <text class="hr-sec-more">全职位累计</text>
        </view>
        <hr-funnel :rows="data.funnel" />
      </view>

      <!-- 今日日程 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">今日日程</text>
          <text class="hr-sec-more" @tap="goInterviews" role="button" tabindex="0" @keydown.enter.prevent.stop="goInterviews" @keydown.space.prevent.stop="goInterviews">面试管理 ›</text>
        </view>
        <view v-if="data.todaySchedule.length">
          <view
            v-for="item in data.todaySchedule"
            :key="item.id"
            class="sch-item"
            @tap="openCandidate(item.candidateId)"
           role="button" tabindex="0" @keydown.enter.prevent.stop="openCandidate(item.candidateId)" @keydown.space.prevent.stop="openCandidate(item.candidateId)">
            <view class="sch-time">
              <text class="sch-time-text">{{ item.scheduledAt.slice(11) }}</text>
            </view>
            <view class="sch-line"></view>
            <view class="sch-body">
              <view class="sch-top">
                <text class="sch-name">{{ item.candidateName }}</text>
                <text class="sch-type">{{ item.type }}</text>
              </view>
              <view class="sch-sub">{{ item.positionTitle }}</view>
              <view class="sch-sub sch-sub--muted">面试官：{{ item.interviewer }}</view>
            </view>
          </view>
        </view>
        <view v-else class="hr-empty hr-empty--sm">今日暂无面试安排</view>
      </view>
    </template>

    <hr-tabbar active="workbench" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import HrNavbar from "@/components/hr-navbar.vue";
import HrTabbar from "@/components/hr-tabbar.vue";
import HrRing from "@/components/hr-ring.vue";
import HrFunnel from "@/components/hr-funnel.vue";
import HrAvatar from "@/components/hr-avatar.vue";
import { getWorkbench } from "@/hr/api";
import { setPendingCandidateFilter } from "@/hr/pending";
import { hrState } from "@/hr/store";
import type { TodoItem, WorkbenchData } from "@/hr/types";

const data = ref<WorkbenchData | null>(null);
const loading = ref(false);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "早上好";
  if (hour < 18) return "下午好";
  return "晚上好";
});

const shortCompany = computed(() => {
  const name = data.value?.companyName || "星海智能";
  return name.length > 9 ? `${name.slice(0, 9)}…` : name;
});

const todoTotal = computed(() => (data.value?.todos || []).reduce((sum, item) => sum + item.count, 0));

const unreadTotal = computed(() => hrState.messages.reduce((sum, item) => sum + item.unread, 0));

const QUICK_ACTIONS = [
  {
    key: "publish",
    label: "发布职位",
    bg: "var(--color-surface)",
    color: "var(--color-primary)",
    action: () => uni.navigateTo({ url: "/pages-hr/position-edit/position-edit" }),
  },
  {
    key: "talent",
    label: "搜索人才",
    bg: "var(--color-surface)",
    color: "var(--color-primary)",
    action: () => uni.reLaunch({ url: "/pages-hr/candidates/candidates" }),
  },
  {
    key: "interview",
    label: "面试安排",
    bg: "var(--color-surface)",
    color: "var(--color-primary)",
    action: () => uni.navigateTo({ url: "/pages-hr/interviews/interviews" }),
  },
  {
    key: "insight",
    label: "招聘洞察",
    bg: "var(--color-surface)",
    color: "var(--color-warning)",
    action: () => uni.reLaunch({ url: "/pages-hr/insight/insight" }),
  },
];

onShow(() => {
  load();
});

onPullDownRefresh(async () => {
  await load();
  uni.stopPullDownRefresh();
});

async function load() {
  loading.value = true;
  try {
    data.value = await getWorkbench();
  } finally {
    loading.value = false;
  }
}

function progressWidth(position: { hiredCount: number; headcount: number }): number {
  if (!position.headcount) return 0;
  const ratio = position.hiredCount / position.headcount;
  return Math.min(Math.max(ratio * 100, 4), 100);
}

function onTodo(todo: TodoItem) {
  if (todo.key === "interview") {
    uni.navigateTo({ url: "/pages-hr/interviews/interviews?tab=today" });
  } else if (todo.key === "resume") {
    setPendingCandidateFilter({ stage: "new" });
    uni.reLaunch({ url: "/pages-hr/candidates/candidates" });
  } else if (todo.key === "offer") {
    setPendingCandidateFilter({ stage: "interview" });
    uni.reLaunch({ url: "/pages-hr/candidates/candidates" });
  } else {
    uni.reLaunch({ url: "/pages-hr/positions/positions" });
  }
}

function goCandidates() {
  uni.reLaunch({ url: "/pages-hr/candidates/candidates" });
}

function goPositions() {
  uni.reLaunch({ url: "/pages-hr/positions/positions" });
}

function goInterviews() {
  uni.navigateTo({ url: "/pages-hr/interviews/interviews" });
}

function goMessages() {
  uni.navigateTo({ url: "/pages-hr/messages/messages" });
}

function openCandidate(id: string) {
  uni.navigateTo({ url: `/pages-hr/candidate-detail/candidate-detail?id=${encodeURIComponent(id)}` });
}

function openPosition(id: string) {
  uni.navigateTo({ url: `/pages-hr/position-detail/position-detail?id=${encodeURIComponent(id)}` });
}
</script>

<style scoped>
/* Hallmark　shape: app screen　genre: modern-minimal　theme: brand　redesign: full　nav: kept　signature: task list　states: existing　v2.0.0 */
/* Hallmark　pre-emit critique: P4 H4 E4 S4 R5 V3　weakest: V, shared tokens preserve distinct task layouts */
/* ---------- 导航栏品牌区 ---------- */
.nav-brand {
  display: flex;
  align-items: center;
}

.nav-brand-text {
  margin-left: 14rpx;
  display: flex;
  flex-direction: column;
}

.nav-brand-name {
  font-size: 25rpx;
  font-weight: 600;
  color: var(--color-paper);
  max-width: 230rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-brand-sub {
  font-size: 19rpx;
  color: var(--color-paper);
  margin-top: 2rpx;
}

.nav-bell {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-paper);
}

.nav-bell-ico {
  width: 42rpx;
  height: 42rpx;
}

.nav-bell-dot {
  position: absolute;
  top: 10rpx;
  right: 12rpx;
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color-danger);
  border: 2rpx solid var(--color-primary);
}

/* ---------- Hero ---------- */
.hero {
  padding: 30rpx 20rpx 0;
  background: var(--color-primary);
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.hero-greeting {
  padding: 0 12rpx 28rpx;
}

.hero-hi {
  display: block;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-paper);
}

.hero-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  color: var(--color-paper);
}

.todo-card {
  background: var(--color-paper);
  border-radius: 18rpx;
  padding: 26rpx 0 14rpx;
  display: flex;
  flex-wrap: wrap;
  box-shadow: none;
  margin-bottom: -40rpx;
}

.todo-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16rpx;
}

.todo-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.todo-count {
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 800;
  line-height: 1;
}

.todo-label {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: var(--color-secondary);
}

/* ---------- 数据卡 ---------- */
.stat-grid {
  display: flex;
  margin: 60rpx 20rpx 0;
  background: var(--color-paper);
  border-radius: 18rpx;
  padding: 26rpx 0;
  box-shadow: none;
}

.stat-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1rpx solid var(--color-surface);
}

.stat-cell:last-child {
  border-right: none;
}

.stat-value {
  font-size: 44rpx;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: var(--color-secondary);
}

/* ---------- 快捷入口 ---------- */
.quick-grid {
  display: flex;
}

.quick-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-icon {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-ico {
  width: 44rpx;
  height: 44rpx;
}

.quick-label {
  margin-top: 12rpx;
  font-size: 23rpx;
  color: var(--color-secondary);
}

/* ---------- AI 推荐候选人 ---------- */
.rec-scroll {
  width: 100%;
  white-space: nowrap;
}

.rec-track {
  display: inline-flex;
  padding-bottom: 6rpx;
}

.rec-row {
  width: 240rpx;
  margin-right: 18rpx;
  padding: 22rpx 20rpx;
  border: 1rpx solid var(--color-surface);
  border-radius: 16rpx;
  display: inline-block;
  vertical-align: top;
  background: var(--color-paper);
}

.rec-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.rec-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.rec-meta {
  margin-top: 6rpx;
  font-size: 21rpx;
  color: var(--color-secondary);
}

.rec-company {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-pos {
  margin-top: 14rpx;
  font-size: 20rpx;
  color: var(--color-primary);
  background: var(--color-surface);
  border-radius: 6rpx;
  padding: 6rpx 12rpx;
  display: inline-block;
  max-width: 200rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 在招职位进度 ---------- */
.prog-item {
  padding: 22rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.prog-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.prog-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prog-title-wrap {
  display: flex;
  align-items: center;
  min-width: 0;
}

.prog-title {
  font-size: 27rpx;
  font-weight: 600;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 420rpx;
}

.prog-count {
  font-size: 23rpx;
  color: var(--color-secondary);
  flex-shrink: 0;
  padding-left: 12rpx;
}

.prog-track {
  margin-top: 14rpx;
  height: 14rpx;
  border-radius: 7rpx;
  background: var(--color-surface);
  overflow: hidden;
}

.prog-bar {
  height: 100%;
  border-radius: 7rpx;
  background: var(--color-primary);
  transition: opacity 0.18s ease;
  min-width: 10rpx;
}

.prog-foot {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  font-size: 21rpx;
  color: var(--color-muted);
}

/* ---------- 今日日程 ---------- */
.sch-item {
  display: flex;
  align-items: stretch;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.sch-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.sch-time {
  width: 96rpx;
  flex-shrink: 0;
}

.sch-time-text {
  font-size: 27rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.sch-line {
  width: 4rpx;
  border-radius: 2rpx;
  background: var(--color-primary);
  margin: 6rpx 20rpx 6rpx 0;
  flex-shrink: 0;
}

.sch-body {
  flex: 1;
  min-width: 0;
}

.sch-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sch-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.sch-type {
  font-size: 20rpx;
  color: var(--color-primary);
  background: var(--color-surface);
  border-radius: 6rpx;
  padding: 4rpx 12rpx;
}

.sch-sub {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: var(--color-secondary);
}

.sch-sub--muted {
  color: var(--color-muted);
  font-size: 21rpx;
}

.hr-empty--sm {
  padding: 50rpx 0;
}

.nav-brand-name, .nav-bell { color: var(--color-ink); }
.nav-brand-sub { color: var(--color-muted); font-size: 21rpx; }
.nav-bell-dot { top: 0; right: 0; width: auto; min-width: 28rpx; height: 28rpx; line-height: 28rpx; border: 2rpx solid var(--color-paper); color: var(--color-paper); font-size: 18rpx; text-align: center; }
.hero { padding: 32rpx 32rpx 0; background: var(--color-paper); border-radius: 0; }
.hero-greeting { padding: 0 0 28rpx; }
.hero-hi { color: var(--color-ink); font-size: 38rpx; font-weight: 600; }
.hero-sub { color: var(--color-muted); font-size: 23rpx; line-height: 1.6; }
.todo-card { margin: 0; padding: 8rpx 0 28rpx; border-radius: 0; background: transparent; }
.todo-item { padding-bottom: 0; }
.todo-icon { display: none; }
.todo-count { margin: 0; color: var(--color-primary); font-weight: 600; font-size: 44rpx; }
.todo-label { margin-top: 14rpx; font-size: 23rpx; }
.stat-grid { margin: 12rpx 0 0; padding: 28rpx 12rpx; border-radius: 0; }
.stat-value { color: var(--color-ink); font-size: 36rpx; font-weight: 600; }
.stat-label { font-size: 22rpx; }
.quick-grid { gap: 12rpx; }
.quick-item { align-items: flex-start; }
.quick-icon { width: 48rpx; height: 48rpx; border-radius: 0; color: var(--color-primary); background: transparent; }
.quick-label { font-size: 24rpx; }
.rec-scroll { white-space: normal; }
.rec-track { display: flex; flex-direction: column; width: 100%; padding: 0; }
.rec-row { position: relative; display: block; width: auto; margin: 0; padding: 28rpx 0 28rpx 100rpx; border: 0; border-bottom: 1rpx solid var(--color-rule); border-radius: 0; background: transparent; }
.rec-row:last-child { border-bottom: 0; padding-bottom: 0; }
.rec-top { position: absolute; left: 0; top: 28rpx; margin: 0; }
.rec-score { position: absolute; left: 440rpx; top: 0; width: 140rpx; color: var(--color-primary); font-size: 32rpx; font-weight: 600; text-align: right; }
.rec-score-label { font-size: 21rpx; font-weight: 400; margin-left: 4rpx; }
.rec-name { padding-right: 130rpx; font-size: 30rpx; font-weight: 600; }
.rec-meta { font-size: 23rpx; }
.rec-pos { margin-top: 10rpx; background: var(--color-surface); color: var(--color-secondary); font-size: 22rpx; max-width: 100%; }

</style>

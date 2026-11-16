<template>
  <view class="hr-page hr-page--plain">
    <view v-if="!position" class="hr-loading">加载中…</view>

    <template v-if="position">
      <!-- 职位头部 -->
      <view class="pos-header">
        <view class="pos-head-row">
          <view class="pos-title-wrap">
            <text class="pos-title">{{ position.title }}</text>
            <view v-if="position.urgent && position.status === 'open'" class="hr-badge hr-badge--urgent">急聘</view>
          </view>
          <view class="hr-badge" :class="`hr-badge--${position.status}`">{{ statusText(position.status) }}</view>
        </view>
        <view class="pos-salary">
          <text class="pos-salary-text">{{ position.salaryMin }}-{{ position.salaryMax }}K</text>
          <text class="pos-salary-unit">　{{ position.experience }}　{{ position.education }}</text>
        </view>
        <view class="pos-tags">
          <text class="pos-tag">{{ position.city }}</text>
          <text class="pos-tag">招 {{ position.headcount }} 人</text>
          <text class="pos-tag">{{ position.field }}</text>
        </view>
      </view>

      <!-- 数据概览 -->
      <view class="data-grid">
        <view class="data-cell">
          <text class="data-value">{{ position.stats.views }}</text>
          <text class="data-label">曝光</text>
        </view>
        <view class="data-cell">
          <text class="data-value" style="color: var(--color-primary)">{{ position.stats.applicants }}</text>
          <text class="data-label">投递</text>
        </view>
        <view class="data-cell">
          <text class="data-value" style="color: var(--color-primary)">{{ position.stats.interviewing }}</text>
          <text class="data-label">面试</text>
        </view>
        <view class="data-cell">
          <text class="data-value" style="color: var(--color-success)">{{ position.stats.hired }}</text>
          <text class="data-label">入职</text>
        </view>
      </view>

      <!-- 招聘漏斗 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">招聘漏斗</text>
          <text class="hr-sec-more">已招 {{ position.hiredCount }}/{{ position.headcount }}</text>
        </view>
        <hr-funnel :rows="funnel" />
      </view>

      <!-- 市场对比（平台数据能力） -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">市场行情对比</text>
          <text class="hr-sec-more">职能洞察平台数据</text>
        </view>
        <view class="cmp-item">
          <view class="cmp-head">
            <text class="cmp-label">本司薪资区间</text>
            <text class="cmp-value">{{ position.salaryMin }}-{{ position.salaryMax }}K</text>
          </view>
          <view class="cmp-track">
            <view class="cmp-bar cmp-bar--self" :style="salaryBarStyle"></view>
          </view>
        </view>
        <view class="cmp-item">
          <view class="cmp-head">
            <text class="cmp-label">市场中位薪资</text>
            <text class="cmp-value">{{ position.marketSalary }}K</text>
          </view>
          <view class="cmp-track">
            <view class="cmp-bar cmp-bar--market" :style="{ width: marketBarWidth + '%' }"></view>
          </view>
        </view>
        <view class="cmp-note" :class="salaryAdvantage >= 0 ? 'cmp-note--good' : 'cmp-note--warn'">
          {{ salaryComment }}
        </view>

        <view class="cmp-metrics">
          <view class="cmp-metric">
            <text class="cmp-metric-value">{{ position.supplyIndex.toFixed(2) }}</text>
            <text class="cmp-metric-label">供需指数</text>
          </view>
          <view class="cmp-metric">
            <text class="cmp-metric-value" :class="position.trendPp >= 0 ? 'up' : 'down'">
              {{ position.trendPp >= 0 ? "+" : "" }}{{ position.trendPp.toFixed(1) }}pp
            </text>
            <text class="cmp-metric-label">需求热度环比</text>
          </view>
          <view class="cmp-metric">
            <text class="cmp-metric-value">{{ position.owner }}</text>
            <text class="cmp-metric-label">招聘负责人</text>
          </view>
        </view>
      </view>

      <!-- 技能要求 -->
      <view class="hr-card">
        <view class="hr-sec-title"><text class="hr-sec-title-main">技能要求</text></view>
        <view class="skill-wrap">
          <text v-for="skill in position.skills" :key="skill" class="hr-tag hr-tag--primary">{{ skill }}</text>
        </view>
      </view>

      <!-- 职位描述 -->
      <view class="hr-card">
        <view class="hr-sec-title"><text class="hr-sec-title-main">职位描述</text></view>
        <view v-for="(line, index) in position.jd" :key="index" class="jd-line">{{ line }}</view>
      </view>

      <!-- 该职位候选人 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">候选人（{{ candidates.length }}）</text>
          <text class="hr-sec-more" @tap="viewAllCandidates" role="button" tabindex="0" @keydown.enter.prevent.stop="viewAllCandidates" @keydown.space.prevent.stop="viewAllCandidates">查看全部 ›</text>
        </view>
        <view v-if="!candidates.length" class="hr-empty hr-empty--sm">该职位暂无候选人</view>
        <view
          v-for="candidate in candidates"
          :key="candidate.id"
          class="mini-cand"
          @tap="openCandidate(candidate.id)"
         role="button" tabindex="0" @keydown.enter.prevent.stop="openCandidate(candidate.id)" @keydown.space.prevent.stop="openCandidate(candidate.id)">
          <hr-avatar :name="candidate.name" :size="72" />
          <view class="mini-info">
            <view class="mini-top">
              <text class="mini-name">{{ candidate.name }}</text>
              <view class="hr-badge" :class="`hr-badge--${candidate.stage}`">{{ stageText(candidate.stage) }}</view>
            </view>
            <text class="mini-sub">{{ candidate.experienceYears }}年　{{ candidate.education }}　{{ candidate.currentCompany }}</text>
          </view>
          <hr-ring :value="candidate.matchScore" :size="84" :stroke="9" />
        </view>
      </view>
    </template>

    <!-- 底部操作栏 -->
    <view v-if="position" class="hr-action-bar">
      <button class="bar-btn" @tap="editPosition">编辑</button>
      <button v-if="position.status === 'open'" class="bar-btn" @tap="refreshPosition">刷新</button>
      <button
        class="bar-btn bar-btn--primary"
        @tap="toggleStatus"
      >
        {{ statusActionText }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import HrFunnel from "@/components/hr-funnel.vue";
import HrRing from "@/components/hr-ring.vue";
import HrAvatar from "@/components/hr-avatar.vue";
import { getPosition, getPositionCandidates, updatePositionStatus } from "@/hr/api";
import { hrState, todayLabel } from "@/hr/store";
import { setPendingCandidateFilter } from "@/hr/pending";
import { CANDIDATE_STAGE_TEXT, POSITION_STATUS_TEXT, type Candidate, type HrPosition, type PositionStatus } from "@/hr/types";

const position = ref<HrPosition | null>(null);
const candidates = ref<Candidate[]>([]);
const positionId = ref("");

onLoad((query) => {
  positionId.value = (query?.id as string) || "";
  load();
});

onShow(() => {
  if (positionId.value) load();
});

async function load() {
  if (!positionId.value) return;
  const [detail, list] = await Promise.all([getPosition(positionId.value), getPositionCandidates(positionId.value)]);
  position.value = detail || null;
  candidates.value = list;
  if (detail) {
    uni.setNavigationBarTitle({ title: detail.title });
  }
}

const funnel = computed(() => {
  const stats = position.value?.stats;
  if (!stats) return [];
  return [
    { label: "投递简历", value: stats.applicants, color: "var(--color-primary)" },
    { label: "筛选通过", value: stats.screening, color: "var(--color-primary)" },
    { label: "进入面试", value: stats.interviewing, color: "var(--color-primary)" },
    { label: "发放 Offer", value: stats.offered, color: "var(--color-warning)" },
    { label: "成功入职", value: stats.hired, color: "var(--color-success)" },
  ];
});

/** 薪资对比：以两者最大值为基准做等比缩放 */
const SALARY_SCALE = 70;

const salaryBarStyle = computed(() => {
  const p = position.value;
  if (!p) return {};
  const max = Math.max(p.salaryMax, p.marketSalary, SALARY_SCALE);
  const left = (p.salaryMin / max) * 100;
  const width = ((p.salaryMax - p.salaryMin) / max) * 100;
  return { left: `${left}%`, width: `${Math.max(width, 6)}%` };
});

const marketBarWidth = computed(() => {
  const p = position.value;
  if (!p) return 0;
  const max = Math.max(p.salaryMax, p.marketSalary, SALARY_SCALE);
  return (p.marketSalary / max) * 100;
});

const salaryAdvantage = computed(() => {
  const p = position.value;
  if (!p) return 0;
  return ((p.salaryMin + p.salaryMax) / 2 - p.marketSalary) / p.marketSalary * 100;
});

const salaryComment = computed(() => {
  const p = position.value;
  if (!p) return "";
  const diff = salaryAdvantage.value;
  if (diff >= 8) return `薪资竞争力强：高于市场中位数 ${diff.toFixed(0)}%，有利于快速吸引优质候选人。`;
  if (diff >= -3) return "薪资与市场中位数基本持平，建议通过技术亮点与团队氛围增强吸引力。";
  return `薪资竞争力偏弱：低于市场中位数 ${Math.abs(diff).toFixed(0)}%，建议上调区间或放宽年限要求。`;
});

const statusActionText = computed(() => {
  const value = position.value?.status;
  if (value === "open") return "暂停招聘";
  if (value === "paused") return "恢复招聘";
  if (value === "draft") return "立即发布";
  return "重新发布";
});

function statusText(value: PositionStatus): string {
  return POSITION_STATUS_TEXT[value] || value;
}

function stageText(value: Candidate["stage"]): string {
  return CANDIDATE_STAGE_TEXT[value] || value;
}

function refreshPosition() {
  const target = hrState.positions.find((item) => item.id === positionId.value);
  if (target) target.updatedAt = todayLabel();
  uni.showToast({ title: "职位已刷新", icon: "success" });
}

function editPosition() {
  uni.navigateTo({ url: `/pages-hr/position-edit/position-edit?id=${encodeURIComponent(positionId.value)}` });
}

async function toggleStatus() {
  if (!position.value) return;
  const next: PositionStatus = position.value.status === "open" ? "paused" : "open";
  const label = next === "open" ? "发布" : "暂停";
  uni.showModal({
    title: `确认${label}职位`,
    content: `职位「${position.value.title}」将被${label}。`,
    success: async (res) => {
      if (!res.confirm) return;
      await updatePositionStatus(positionId.value, next);
      uni.showToast({ title: `已${label}`, icon: "success" });
      load();
    },
  });
}

function viewAllCandidates() {
  setPendingCandidateFilter({ stage: "all" });
  uni.reLaunch({ url: "/pages-hr/candidates/candidates" });
}

function openCandidate(id: string) {
  uni.navigateTo({ url: `/pages-hr/candidate-detail/candidate-detail?id=${encodeURIComponent(id)}` });
}
</script>

<style scoped>
/* Hallmark　shape: app screen　genre: modern-minimal　theme: brand　redesign: full　nav: kept　signature: task list　states: existing　v2.0.0 */
/* Hallmark　pre-emit critique: P4 H4 E4 S4 R5 V3　weakest: V, shared tokens preserve distinct task layouts */
/* ---------- 头部 ---------- */
.pos-header {
  background: var(--color-primary);
  padding: 32rpx 28rpx 36rpx;
}

.pos-head-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pos-title-wrap {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  padding-right: 16rpx;
}

.pos-title {
  font-size: 38rpx;
  font-weight: 700;
  color: var(--color-paper);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380rpx;
}

.pos-salary {
  margin-top: 16rpx;
  display: flex;
  align-items: baseline;
}

.pos-salary-text {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--color-primary);
}

.pos-salary-unit {
  margin-left: 16rpx;
  font-size: 23rpx;
  color: var(--color-paper);
}

.pos-tags {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
}

.pos-tag {
  font-size: 21rpx;
  color: var(--color-paper);
  background: var(--color-rule);
  border-radius: 22rpx;
  padding: 6rpx 18rpx;
  margin: 0 14rpx 10rpx 0;
}

/* ---------- 数据概览 ---------- */
.data-grid {
  display: flex;
  margin: -20rpx 20rpx 0;
  background: var(--color-paper);
  border-radius: 18rpx;
  padding: 26rpx 0;
  box-shadow: none;
}

.data-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-right: 1rpx solid var(--color-surface);
}

.data-cell:last-child {
  border-right: none;
}

.data-value {
  font-size: 42rpx;
  font-weight: 800;
  color: var(--color-primary);
  line-height: 1;
}

.data-label {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: var(--color-secondary);
}

/* ---------- 市场对比 ---------- */
.cmp-item {
  margin-bottom: 20rpx;
}

.cmp-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10rpx;
}

.cmp-label {
  font-size: 24rpx;
  color: var(--color-secondary);
}

.cmp-value {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.cmp-track {
  position: relative;
  height: 22rpx;
  border-radius: 11rpx;
  background: var(--color-surface);
}

.cmp-bar {
  height: 100%;
  border-radius: 11rpx;
  min-width: 12rpx;
}

.cmp-bar--self {
  position: absolute;
  top: 0;
  background: var(--color-primary);
}

.cmp-bar--market {
  background: var(--color-primary);
}

.cmp-note {
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border-radius: 12rpx;
  font-size: 23rpx;
  line-height: 1.6;
}

.cmp-note--good {
  background: var(--color-primary-soft);
  color: var(--color-success);
}

.cmp-note--warn {
  background: var(--color-primary-soft);
  color: var(--color-warning);
}

.cmp-metrics {
  display: flex;
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid var(--color-surface);
}

.cmp-metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cmp-metric-value {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.cmp-metric-value.up {
  color: var(--color-danger);
}

.cmp-metric-value.down {
  color: var(--color-success);
}

.cmp-metric-label {
  margin-top: 8rpx;
  font-size: 20rpx;
  color: var(--color-muted);
}

/* ---------- 技能 / JD ---------- */
.skill-wrap {
  margin-bottom: -6rpx;
}

.jd-line {
  font-size: 25rpx;
  color: var(--color-secondary);
  line-height: 1.8;
  padding-left: 22rpx;
  position: relative;
  margin-bottom: 12rpx;
}

.jd-line::before {
  content: "";
  position: absolute;
  left: 0;
  top: 18rpx;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: var(--color-primary);
}

/* ---------- 候选人 ---------- */
.mini-cand {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--color-surface);
}

.mini-cand:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.mini-info {
  flex: 1;
  min-width: 0;
  margin: 0 18rpx;
}

.mini-top {
  display: flex;
  align-items: center;
}

.mini-name {
  font-size: 27rpx;
  font-weight: 700;
  color: var(--color-ink);
  margin-right: 14rpx;
}

.mini-sub {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hr-empty--sm {
  padding: 40rpx 0;
}

/* ---------- 底部操作栏 ---------- */
.bar-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 27rpx;
  margin-left: 18rpx;
  background: var(--color-paper);
  color: var(--color-secondary);
  border: 1rpx solid var(--color-surface);
  padding: 0;
}

.bar-btn::after {
  border: none;
}

.bar-btn:first-child {
  margin-left: 0;
}

.bar-btn--primary {
  background: var(--color-primary);
  color: var(--color-paper);
  border-color: transparent;
  box-shadow: none;
}

.pos-header { background: var(--color-paper); padding: 32rpx; }
.pos-title { color: var(--color-ink); font-size: 38rpx; font-weight: 600; }
.pos-salary-text { color: var(--color-primary); }
.pos-salary-unit { color: var(--color-secondary); }
.pos-tag { background: var(--color-surface); color: var(--color-secondary); border-radius: 6rpx; }
.data-grid { margin: 0; border-radius: 0; padding: 28rpx 0; }
.data-value { color: var(--color-ink); font-weight: 600; }

</style>

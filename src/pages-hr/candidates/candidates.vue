<template>
  <view class="hr-page">
    <hr-navbar title="候选人" :subtitle="`人才库 ${filtered.length} 人`" />

    <!-- 搜索 -->
    <view class="search-wrap">
      <view class="search-bar">
        <svg aria-hidden="true" viewBox="0 0 24 24" class="search-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索姓名 / 当前职位 / 公司 / 技能"
          :maxlength="40"
          confirm-type="search"
          @confirm="load"
        />
        <text v-if="keyword" class="search-clear" @tap="clearKeyword" role="button" tabindex="0" @keydown.enter.prevent.stop="clearKeyword" @keydown.space.prevent.stop="clearKeyword">✕</text>
      </view>
    </view>

    <!-- 阶段 Tab -->
    <scroll-view scroll-x class="tab-scroll" :show-scrollbar="false">
      <view class="tab-track">
        <view
          v-for="tab in STAGE_TABS"
          :key="tab.value"
          class="tab-item"
          :class="{ 'tab-item--active': stage === tab.value }"
          @tap="pickStage(tab.value)"
         role="button" tabindex="0" @keydown.enter.prevent.stop="pickStage(tab.value)" @keydown.space.prevent.stop="pickStage(tab.value)">
          {{ tab.label }}
          <text v-if="counts[tab.value]" class="tab-count">{{ counts[tab.value] }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 匹配度 / 排序筛选 -->
    <view class="filter-row">
      <view class="filter-group">
        <text
          v-for="item in SCORE_FILTERS"
          :key="item.label"
          class="filter-chip"
          :class="{ 'filter-chip--active': minScore === item.value }"
          @tap="pickScore(item.value)"
         role="button" tabindex="0" @keydown.enter.prevent.stop="pickScore(item.value)" @keydown.space.prevent.stop="pickScore(item.value)">
          {{ item.label }}
        </text>
      </view>
      <view class="filter-sort" @tap="toggleSort" role="button" tabindex="0" @keydown.enter.prevent.stop="toggleSort" @keydown.space.prevent.stop="toggleSort">
        <text class="filter-sort-text">{{ sort === "match" ? "匹配度优先" : "最新优先" }}</text>
        <text class="filter-sort-arrow">{{ sort === "match" ? "⇅" : "⇵" }}</text>
      </view>
    </view>

    <view v-if="loading && !list.length" class="hr-loading">加载中…</view>
    <view v-else-if="!filtered.length" class="hr-empty">没有符合条件的候选人</view>

    <view v-for="candidate in filtered" :key="candidate.id" class="cand-card">
      <view class="cand-main" @tap="openDetail(candidate.id)" role="button" tabindex="0" @keydown.enter.prevent.stop="openDetail(candidate.id)" @keydown.space.prevent.stop="openDetail(candidate.id)">
        <view class="cand-top">
          <hr-avatar :name="candidate.name" :size="92" />
          <view class="cand-info">
            <view class="cand-name-row">
              <text class="cand-name">{{ candidate.name }}</text>
              <text class="cand-basic">{{ candidate.age }}岁　{{ candidate.gender }}</text>
            </view>
            <view class="cand-line">{{ candidate.education }}　{{ candidate.school }}　{{ candidate.experienceYears }}年</view>
            <view class="cand-line cand-line--ellipsis">{{ candidate.currentTitle }} @ {{ candidate.currentCompany }}</view>
          </view>
          <view class="cand-score">
            <text class="cand-match-value">{{ candidate.matchScore }}<text class="cand-match-unit">%</text></text>
            <text class="cand-score-label">匹配度</text>
          </view>
        </view>

        <view class="cand-mid">
          <view class="cand-pos">
            <text class="cand-pos-label">应聘</text>
            <text class="cand-pos-value">{{ candidate.positionTitle }}</text>
          </view>
          <view class="hr-badge" :class="`hr-badge--${candidate.stage}`">{{ stageText(candidate.stage) }}</view>
        </view>

        <view class="cand-skills">
          <text
            v-for="skill in candidate.matchedSkills.slice(0, 3)"
            :key="`m-${skill}`"
            class="hr-tag hr-tag--primary"
          >
            {{ skill }}
          </text>
          <text
            v-for="skill in candidate.skills.filter((s) => !candidate.matchedSkills.includes(s)).slice(0, 2)"
            :key="`o-${skill}`"
            class="hr-tag"
          >
            {{ skill }}
          </text>
        </view>

        <view class="cand-ai">
          <text class="cand-ai-tag">匹配摘要</text>
          <text class="cand-ai-text">{{ candidate.aiSummary }}</text>
        </view>

        <view class="cand-foot">
          <text>{{ candidate.appliedAt.slice(5) }}　{{ candidate.source }}</text>
          <text v-if="candidate.interviewScore" class="cand-iv">面试 {{ candidate.interviewScore }} 分</text>
        </view>
      </view>

      <!-- 流程操作 -->
      <view v-if="candidate.stage !== 'hired'" class="cand-actions">
        <text
          v-if="candidate.stage === 'rejected'"
          class="cand-btn cand-btn--primary"
          @tap="restore(candidate.id)"
         role="button" tabindex="0" @keydown.enter.prevent.stop="restore(candidate.id)" @keydown.space.prevent.stop="restore(candidate.id)">
          恢复候选
        </text>
        <template v-else>
          <text class="cand-btn" @tap="reject(candidate)" role="button" tabindex="0" @keydown.enter.prevent.stop="reject(candidate)" @keydown.space.prevent.stop="reject(candidate)">淘汰</text>
          <text class="cand-btn cand-btn--primary" @tap="advance(candidate)" role="button" tabindex="0" @keydown.enter.prevent.stop="advance(candidate)" @keydown.space.prevent.stop="advance(candidate)">{{ advanceText(candidate.stage) }}</text>
        </template>
      </view>
      <view v-else class="cand-actions cand-actions--done">已完成入职流程</view>
    </view>

    <hr-tabbar active="candidates" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import HrNavbar from "@/components/hr-navbar.vue";
import HrTabbar from "@/components/hr-tabbar.vue";
import HrRing from "@/components/hr-ring.vue";
import HrAvatar from "@/components/hr-avatar.vue";
import { getCandidates, getStageCounts, updateCandidateStage } from "@/hr/api";
import { takePendingCandidateFilter } from "@/hr/pending";
import { CANDIDATE_STAGE_TEXT, type Candidate, type CandidateStage } from "@/hr/types";

type StageFilter = CandidateStage | "all";

const STAGE_TABS: Array<{ label: string; value: StageFilter }> = [
  { label: "全部", value: "all" },
  { label: "新投递", value: "new" },
  { label: "筛选中", value: "screening" },
  { label: "面试中", value: "interview" },
  { label: "已发 Offer", value: "offer" },
  { label: "已入职", value: "hired" },
  { label: "已淘汰", value: "rejected" },
];

const SCORE_FILTERS = [
  { label: "全部", value: 0 },
  { label: "90+", value: 90 },
  { label: "80+", value: 80 },
  { label: "70+", value: 70 },
];

const stage = ref<StageFilter>("all");
const keyword = ref("");
const minScore = ref(0);
const sort = ref<"match" | "latest">("match");
const loading = ref(false);
const list = ref<Candidate[]>([]);

const counts = computed(() => getStageCounts());

/** 服务端已按条件返回，这里仅做兜底展示过滤，保证交互即时响应 */
const filtered = computed(() => list.value.filter((item) => item.matchScore >= minScore.value));

watch([stage, sort], () => load());

onShow(() => {
  const pending = takePendingCandidateFilter();
  if (pending?.stage) {
    stage.value = pending.stage as StageFilter;
  }
  load();
});

async function load() {
  loading.value = true;
  try {
    list.value = await getCandidates({
      stage: stage.value,
      keyword: keyword.value,
      sort: sort.value,
    });
  } finally {
    loading.value = false;
  }
}

function pickStage(value: StageFilter) {
  if (stage.value === value) return;
  stage.value = value;
}

function pickScore(value: number) {
  minScore.value = minScore.value === value ? 0 : value;
}

function toggleSort() {
  sort.value = sort.value === "match" ? "latest" : "match";
}

function clearKeyword() {
  keyword.value = "";
  load();
}

function stageText(value: CandidateStage): string {
  return CANDIDATE_STAGE_TEXT[value] || value;
}

const ADVANCE_TEXT: Record<string, string> = {
  new: "进入筛选",
  screening: "安排面试",
  interview: "发放 Offer",
  offer: "标记入职",
};

function advanceText(value: CandidateStage): string {
  return ADVANCE_TEXT[value] || "推进";
}

const NEXT_STAGE: Record<string, CandidateStage> = {
  new: "screening",
  screening: "interview",
  interview: "offer",
  offer: "hired",
};

async function advance(candidate: Candidate) {
  const next = NEXT_STAGE[candidate.stage];
  if (!next) return;
  const label = advanceText(candidate.stage);
  uni.showModal({
    title: `确认${label}`,
    content: `将「${candidate.name}」推进至「${stageText(next)}」阶段。`,
    success: async (res) => {
      if (!res.confirm) return;
      await updateCandidateStage(candidate.id, next);
      uni.showToast({ title: `已推进至${stageText(next)}`, icon: "success" });
      load();
    },
  });
}

async function reject(candidate: Candidate) {
  uni.showModal({
    title: "确认淘汰",
    content: `「${candidate.name}」将被移入已淘汰，可在人才库中恢复。`,
    success: async (res) => {
      if (!res.confirm) return;
      await updateCandidateStage(candidate.id, "rejected");
      uni.showToast({ title: "已淘汰", icon: "success" });
      load();
    },
  });
}

async function restore(id: string) {
  await updateCandidateStage(id, "screening");
  uni.showToast({ title: "已恢复至筛选中", icon: "success" });
  load();
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages-hr/candidate-detail/candidate-detail?id=${encodeURIComponent(id)}` });
}
</script>

<style scoped>
/* Hallmark　shape: app screen　genre: modern-minimal　theme: brand　redesign: full　nav: kept　signature: task list　states: existing　v2.0.0 */
/* Hallmark　pre-emit critique: P4 H4 E4 S4 R5 V3　weakest: V, shared tokens preserve distinct task layouts */
.search-wrap {
  padding: 20rpx 20rpx 4rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 76rpx;
  background: var(--color-paper);
  border-radius: 38rpx;
  padding: 0 26rpx;
  box-shadow: none;
}

.search-ico {
  width: 32rpx;
  height: 32rpx;
  color: var(--color-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  margin-left: 14rpx;
  font-size: 26rpx;
  color: var(--color-ink);
}

.search-clear {
  color: var(--color-rule);
  font-size: 26rpx;
  padding-left: 16rpx;
}

/* ---------- 阶段 Tab ---------- */
.tab-scroll {
  width: 100%;
  white-space: nowrap;
  padding: 18rpx 0 0;
}

.tab-track {
  display: inline-flex;
  padding: 0 20rpx;
}

.tab-item {
  display: inline-block;
  padding: 12rpx 28rpx;
  margin-right: 14rpx;
  border-radius: 32rpx;
  background: var(--color-paper);
  font-size: 24rpx;
  color: var(--color-secondary);
  border: 1rpx solid var(--color-surface);
}

.tab-item--active {
  background: var(--color-primary);
  color: var(--color-paper);
  border-color: var(--color-primary);
  font-weight: 600;
}

.tab-count {
  margin-left: 8rpx;
  font-size: 20rpx;
  opacity: 0.75;
}

/* ---------- 筛选行 ---------- */
.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 20rpx 4rpx;
}

.filter-group {
  display: flex;
}

.filter-chip {
  padding: 8rpx 22rpx;
  margin-right: 12rpx;
  border-radius: 24rpx;
  font-size: 23rpx;
  color: var(--color-secondary);
  background: var(--color-paper);
  border: 1rpx solid var(--color-surface);
}

.filter-chip--active {
  color: var(--color-primary);
  background: var(--color-surface);
  border-color: var(--color-primary-soft);
  font-weight: 600;
}

.filter-sort {
  display: flex;
  align-items: center;
}

.filter-sort-text {
  font-size: 23rpx;
  color: var(--color-secondary);
}

.filter-sort-arrow {
  margin-left: 8rpx;
  font-size: 22rpx;
  color: var(--color-primary);
}

/* ---------- 候选人卡片 ---------- */
.cand-card {
  background: var(--color-paper);
  border-radius: 18rpx;
  margin: 20rpx 20rpx 0;
  box-shadow: none;
  overflow: hidden;
}

.cand-main {
  padding: 26rpx 24rpx 18rpx;
}

.cand-top {
  display: flex;
  align-items: flex-start;
}

.cand-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.cand-name-row {
  display: flex;
  align-items: baseline;
}

.cand-name {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--color-ink);
}

.cand-basic {
  margin-left: 14rpx;
  font-size: 22rpx;
  color: var(--color-muted);
}

.cand-line {
  margin-top: 8rpx;
  font-size: 23rpx;
  color: var(--color-secondary);
}

.cand-line--ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cand-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-left: 10rpx;
}

.cand-score-label {
  margin-top: 6rpx;
  font-size: 19rpx;
  color: var(--color-muted);
}

.cand-mid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid var(--color-surface);
  border-bottom: 1rpx solid var(--color-surface);
}

.cand-pos {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  padding-right: 16rpx;
}

.cand-pos-label {
  flex-shrink: 0;
  font-size: 20rpx;
  color: var(--color-paper);
  background: var(--color-rule);
  border-radius: 4rpx;
  padding: 3rpx 10rpx;
  margin-right: 12rpx;
}

.cand-pos-value {
  font-size: 25rpx;
  color: var(--color-ink);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cand-skills {
  margin-top: 18rpx;
  margin-bottom: -6rpx;
}

.cand-ai {
  margin-top: 16rpx;
  padding: 16rpx 18rpx;
  background: var(--color-surface);
  border-radius: 12rpx;
  display: flex;
  align-items: flex-start;
}

.cand-ai-tag {
  flex-shrink: 0;
  font-size: 19rpx;
  font-weight: 700;
  color: var(--color-paper);
  background: var(--color-primary);
  border-radius: 6rpx;
  padding: 3rpx 10rpx;
  margin-right: 12rpx;
  margin-top: 2rpx;
}

.cand-ai-text {
  flex: 1;
  font-size: 23rpx;
  color: var(--color-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cand-foot {
  margin-top: 16rpx;
  display: flex;
  justify-content: space-between;
  font-size: 21rpx;
  color: var(--color-muted);
}

.cand-iv {
  color: var(--color-primary);
}

/* ---------- 操作区 ---------- */
.cand-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16rpx 24rpx;
  background: var(--color-paper);
  border-top: 1rpx solid var(--color-surface);
}

.cand-actions--done {
  justify-content: center;
  font-size: 22rpx;
  color: var(--color-muted);
}

.cand-btn {
  margin-left: 16rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: var(--color-secondary);
  background: var(--color-paper);
  border: 1rpx solid var(--color-surface);
}

.cand-btn--primary {
  color: var(--color-paper);
  background: var(--color-primary);
  border-color: transparent;
}

.search-wrap { margin: 0; padding: 20rpx 32rpx; background: var(--color-paper); }
.search-bar { border-radius: 8rpx; background: var(--color-surface); }
.tab-scroll { background: var(--color-paper); }
.tab-track { padding-left: 32rpx; }
.tab-item { font-size: 27rpx; }
.filter-row { padding: 20rpx 32rpx; background: var(--color-paper); border-top: 1rpx solid var(--color-rule); }
.filter-chip { border-radius: 6rpx; }
.cand-card { margin: 12rpx 0 0; border-radius: 0; }
.cand-main { padding: 30rpx 32rpx 20rpx; }
.cand-name { font-size: 34rpx; font-weight: 600; }
.cand-info { min-width: 0; }
.cand-top { align-items: flex-start; }
.cand-score { min-width: 110rpx; }
.cand-match-value { color: var(--color-primary); font-size: 40rpx; font-weight: 600; line-height: 1.2; }
.cand-match-unit { font-size: 23rpx; font-weight: 400; }
.cand-score-label { margin-top: 6rpx; font-size: 21rpx; }
.cand-ai { background: transparent; border-radius: 0; padding: 18rpx 0 0; border-top: 1rpx solid var(--color-rule); align-items: flex-start; }
.cand-ai-tag { background: transparent; color: var(--color-secondary); font-size: 22rpx; padding: 0; flex-shrink: 0; }
.cand-ai-text { color: var(--color-muted); font-size: 23rpx; line-height: 1.6; }
.cand-actions { padding: 16rpx 32rpx; justify-content: flex-end; gap: 16rpx; }
.cand-btn { min-width: 128rpx; text-align: center; border: 1rpx solid var(--color-rule); border-radius: 6rpx; }
.cand-btn--primary { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-primary-soft); }

</style>

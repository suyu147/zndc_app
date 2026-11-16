<template>
  <view class="hr-page hr-page--plain">
    <view v-if="!candidate" class="hr-loading">加载中…</view>

    <template v-if="candidate">
      <!-- 头部 -->
      <view class="cand-header">
        <view class="ch-top">
          <hr-avatar :name="candidate.name" :size="116" />
          <view class="ch-info">
            <view class="ch-name-row">
              <text class="ch-name">{{ candidate.name }}</text>
              <text class="ch-basic">{{ candidate.age }}岁 · {{ candidate.gender }}</text>
            </view>
            <text class="ch-line">{{ candidate.education }} · {{ candidate.school }} · {{ candidate.major }}</text>
            <text class="ch-line">{{ candidate.experienceYears }} 年经验 · {{ candidate.expectCity }}</text>
            <view class="ch-tags">
              <view class="hr-badge" :class="`hr-badge--${candidate.stage}`">{{ stageText(candidate.stage) }}</view>
              <text class="ch-expect">期望 {{ candidate.expectSalary }}</text>
            </view>
          </view>
          <hr-ring :value="candidate.matchScore" :size="130" :stroke="10" unit="匹配度" />
        </view>
        <view class="ch-pos" @tap="openPosition(candidate.positionId)">
          <text class="ch-pos-label">应聘职位</text>
          <text class="ch-pos-value">{{ candidate.positionTitle }}</text>
          <text class="ch-pos-arrow">›</text>
        </view>
      </view>

      <!-- 匹配度分析 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">人岗匹配分析</text>
          <text class="hr-sec-more">AI 综合评分 {{ candidate.matchScore }}</text>
        </view>
        <view v-for="dim in candidate.dimensions" :key="dim.name" class="dim-item">
          <view class="dim-head">
            <text class="dim-name">{{ dim.name }}</text>
            <text class="dim-score">{{ dim.score }}</text>
          </view>
          <view class="dim-track">
            <view class="dim-bar" :style="{ width: dim.score + '%', background: dimColor(dim.score) }"></view>
          </view>
          <text v-if="dim.comment" class="dim-comment">{{ dim.comment }}</text>
        </view>
      </view>

      <!-- AI 评价 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">AI 综合评价</text>
          <text class="hr-sec-more">职能洞察匹配引擎</text>
        </view>
        <view class="ai-summary">{{ candidate.aiSummary }}</view>
        <view v-if="candidate.aiPros.length" class="ai-block">
          <text class="ai-block-title ai-block-title--pro">核心优势</text>
          <view v-for="item in candidate.aiPros" :key="item" class="ai-item">
            <text class="ai-item-dot ai-item-dot--pro">✓</text>
            <text class="ai-item-text">{{ item }}</text>
          </view>
        </view>
        <view v-if="candidate.aiCons.length" class="ai-block">
          <text class="ai-block-title ai-block-title--con">潜在风险</text>
          <view v-for="item in candidate.aiCons" :key="item" class="ai-item">
            <text class="ai-item-dot ai-item-dot--con">!</text>
            <text class="ai-item-text">{{ item }}</text>
          </view>
        </view>
      </view>

      <!-- 技能对比 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">技能对比</text>
          <text class="hr-sec-more">匹配 {{ candidate.matchedSkills.length }} / 缺失 {{ candidate.missingSkills.length }}</text>
        </view>
        <view v-if="candidate.matchedSkills.length" class="skill-group">
          <text class="skill-group-title">已具备（{{ candidate.matchedSkills.length }}）</text>
          <view class="skill-wrap">
            <text v-for="skill in candidate.matchedSkills" :key="`m-${skill}`" class="hr-tag hr-tag--success">
              ✓ {{ skill }}
            </text>
          </view>
        </view>
        <view v-if="candidate.missingSkills.length" class="skill-group">
          <text class="skill-group-title skill-group-title--miss">岗位要求但未体现（{{ candidate.missingSkills.length }}）</text>
          <view class="skill-wrap">
            <text v-for="skill in candidate.missingSkills" :key="`x-${skill}`" class="hr-tag hr-tag--danger">
              ✕ {{ skill }}
            </text>
          </view>
        </view>
        <view v-if="otherSkills.length" class="skill-group">
          <text class="skill-group-title">其他技能</text>
          <view class="skill-wrap">
            <text v-for="skill in otherSkills" :key="`o-${skill}`" class="hr-tag">{{ skill }}</text>
          </view>
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="hr-card">
        <view class="hr-sec-title"><text class="hr-sec-title-main">基本信息</text></view>
        <view class="hr-row">
          <text class="hr-row-label">手机号码</text>
          <text class="hr-row-value" @tap="copy(candidate.phone)">{{ candidate.phone }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">电子邮箱</text>
          <text class="hr-row-value" @tap="copy(candidate.email)">{{ candidate.email }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">当前职位</text>
          <text class="hr-row-value">{{ candidate.currentTitle }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">当前公司</text>
          <text class="hr-row-value">{{ candidate.currentCompany }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">毕业院校</text>
          <text class="hr-row-value">{{ candidate.school }} · {{ candidate.major }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">期望城市</text>
          <text class="hr-row-value">{{ candidate.expectCity }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">来源渠道</text>
          <text class="hr-row-value">{{ candidate.source }}</text>
        </view>
        <view class="hr-row">
          <text class="hr-row-label">投递时间</text>
          <text class="hr-row-value">{{ candidate.appliedAt }}</text>
        </view>
        <view v-if="candidate.lastContact" class="hr-row">
          <text class="hr-row-label">最近进展</text>
          <text class="hr-row-value hr-row-value--accent">{{ candidate.lastContact }}</text>
        </view>
      </view>

      <!-- 简历亮点 -->
      <view v-if="candidate.highlights.length" class="hr-card">
        <view class="hr-sec-title"><text class="hr-sec-title-main">简历亮点</text></view>
        <view v-for="(item, index) in candidate.highlights" :key="index" class="hl-item">
          <text class="hl-index">{{ index + 1 }}</text>
          <text class="hl-text">{{ item }}</text>
        </view>
      </view>

      <!-- 面试记录 -->
      <view class="hr-card">
        <view class="hr-sec-title">
          <text class="hr-sec-title-main">面试记录</text>
          <text class="hr-sec-more" @tap="goInterviews">面试管理 ›</text>
        </view>
        <view v-if="!interviews.length" class="hr-empty hr-empty--sm">暂无面试记录</view>
        <view v-for="item in interviews" :key="item.id" class="iv-item" @tap="toggleReport(item.id)">
          <view class="iv-top">
            <text class="iv-type">{{ item.type }}</text>
            <text class="iv-score" v-if="item.score">得分 {{ item.score }}</text>
            <text class="iv-score iv-score--none" v-else>{{ statusText(item.status) }}</text>
          </view>
          <view class="iv-meta">{{ item.scheduledAt }} · {{ item.interviewer }}</view>
          <view v-if="item.report && expandedReport === item.id" class="iv-report">
            <view class="iv-report-summary">{{ item.report.summary }}</view>
            <view class="iv-dims">
              <view v-for="dim in item.report.dimensions" :key="dim.name" class="iv-dim">
                <text class="iv-dim-name">{{ dim.name }}</text>
                <text class="iv-dim-score">{{ dim.score }}</text>
              </view>
            </view>
            <view class="iv-report-block">
              <text class="iv-report-label">表现亮点</text>
              <view v-for="s in item.report.strengths" :key="s" class="iv-report-line">· {{ s }}</view>
            </view>
            <view class="iv-report-block">
              <text class="iv-report-label">待提升</text>
              <view v-for="s in item.report.improvements" :key="s" class="iv-report-line">· {{ s }}</view>
            </view>
            <view class="iv-report-suggest">{{ item.report.suggestion }}</view>
          </view>
          <view v-if="item.report" class="iv-toggle">
            {{ expandedReport === item.id ? "收起面试报告" : "查看 AI 面试报告" }}
          </view>
        </view>
      </view>
    </template>

    <!-- 底部操作 -->
    <view v-if="candidate" class="hr-action-bar">
      <button v-if="candidate.stage !== 'hired'" class="bar-btn" @tap="openChat">沟通</button>
      <button
        v-if="candidate.stage !== 'hired'"
        class="bar-btn"
        @tap="candidate.stage === 'rejected' ? restore() : reject()"
      >
        {{ candidate.stage === "rejected" ? "恢复候选" : "淘汰" }}
      </button>
      <button v-if="candidate.stage !== 'hired'" class="bar-btn bar-btn--primary" @tap="advance">
        {{ advanceText }}
      </button>
      <button v-else class="bar-btn bar-btn--primary" @tap="openChat">已入职 · 继续沟通</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import HrAvatar from "@/components/hr-avatar.vue";
import HrRing from "@/components/hr-ring.vue";
import { getCandidate, getInterviewByCandidate, updateCandidateStage } from "@/hr/api";
import { CANDIDATE_STAGE_TEXT, INTERVIEW_STATUS_TEXT, type Candidate, type CandidateStage, type InterviewRecord, type InterviewStatus } from "@/hr/types";

const candidate = ref<Candidate | null>(null);
const interviews = ref<InterviewRecord[]>([]);
const expandedReport = ref("");
const candidateId = ref("");

onLoad((query) => {
  candidateId.value = (query?.id as string) || "";
  load();
});

onShow(() => {
  if (candidateId.value) load();
});

async function load() {
  if (!candidateId.value) return;
  const [detail, list] = await Promise.all([
    getCandidate(candidateId.value),
    getInterviewByCandidate(candidateId.value),
  ]);
  candidate.value = detail || null;
  interviews.value = list;
  if (detail) uni.setNavigationBarTitle({ title: detail.name });
}

const otherSkills = computed(() => {
  const item = candidate.value;
  if (!item) return [];
  return item.skills.filter((skill) => !item.matchedSkills.includes(skill) && !item.missingSkills.includes(skill));
});

const ADVANCE_TEXT: Record<string, string> = {
  new: "进入筛选",
  screening: "安排面试",
  interview: "发放 Offer",
  offer: "标记入职",
  rejected: "恢复候选",
};

const NEXT_STAGE: Record<string, CandidateStage> = {
  new: "screening",
  screening: "interview",
  interview: "offer",
  offer: "hired",
  rejected: "screening",
};

const advanceText = computed(() => {
  const stage = candidate.value?.stage;
  if (!stage || stage === "hired") return "";
  return stage === "rejected" ? "恢复候选" : ADVANCE_TEXT[stage] || "推进";
});

function stageText(value: CandidateStage): string {
  return CANDIDATE_STAGE_TEXT[value] || value;
}

function statusText(value: InterviewStatus): string {
  return INTERVIEW_STATUS_TEXT[value] || value;
}

function dimColor(score: number): string {
  if (score >= 90) return "linear-gradient(90deg, #00BEBD 0%, #00A6A5 100%)";
  if (score >= 80) return "linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%)";
  if (score >= 70) return "linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)";
  return "linear-gradient(90deg, #FB7185 0%, #E5484D 100%)";
}

function toggleReport(id: string) {
  expandedReport.value = expandedReport.value === id ? "" : id;
}

function copy(value: string) {
  uni.setClipboardData({ data: value });
}

async function advance() {
  const item = candidate.value;
  if (!item) return;
  const next = NEXT_STAGE[item.stage];
  if (!next) return;
  uni.showModal({
    title: `确认${advanceText.value}`,
    content: `将「${item.name}」推进至「${stageText(next)}」阶段。`,
    success: async (res) => {
      if (!res.confirm) return;
      await updateCandidateStage(item.id, next);
      uni.showToast({ title: `已推进至${stageText(next)}`, icon: "success" });
      load();
    },
  });
}

async function reject() {
  const item = candidate.value;
  if (!item) return;
  uni.showModal({
    title: "确认淘汰",
    content: `「${item.name}」将被移入已淘汰，可在人才库中恢复。`,
    success: async (res) => {
      if (!res.confirm) return;
      await updateCandidateStage(item.id, "rejected");
      uni.showToast({ title: "已淘汰", icon: "success" });
      load();
    },
  });
}

async function restore() {
  const item = candidate.value;
  if (!item) return;
  await updateCandidateStage(item.id, "screening");
  uni.showToast({ title: "已恢复至筛选中", icon: "success" });
  load();
}

function openChat() {
  const item = candidate.value;
  if (!item) return;
  uni.navigateTo({
    url: `/pages-hr/chat/chat?candidateId=${encodeURIComponent(item.id)}&name=${encodeURIComponent(item.name)}`,
  });
}

function openPosition(id: string) {
  uni.navigateTo({ url: `/pages-hr/position-detail/position-detail?id=${encodeURIComponent(id)}` });
}

function goInterviews() {
  uni.navigateTo({ url: "/pages-hr/interviews/interviews" });
}
</script>

<style scoped>
/* ---------- 头部 ---------- */
.cand-header {
  background: linear-gradient(135deg, #0a444c 0%, #00a6a5 100%);
  padding: 32rpx 28rpx 0;
}

.ch-top {
  display: flex;
  align-items: flex-start;
}

.ch-info {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.ch-name-row {
  display: flex;
  align-items: baseline;
}

.ch-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #ffffff;
}

.ch-basic {
  margin-left: 14rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.ch-line {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch-tags {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
}

.ch-expect {
  margin-left: 16rpx;
  font-size: 22rpx;
  color: #ffd28a;
  font-weight: 600;
}

.ch-pos {
  margin-top: 26rpx;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 14rpx 14rpx 0 0;
  display: flex;
  align-items: center;
}

.ch-pos-label {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
}

.ch-pos-value {
  flex: 1;
  margin-left: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ch-pos-arrow {
  color: rgba(255, 255, 255, 0.7);
  font-size: 30rpx;
  flex-shrink: 0;
}

/* ---------- 匹配维度 ---------- */
.dim-item {
  margin-bottom: 22rpx;
}

.dim-item:last-child {
  margin-bottom: 0;
}

.dim-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.dim-name {
  font-size: 25rpx;
  color: #1a1d24;
}

.dim-score {
  font-size: 27rpx;
  font-weight: 700;
  color: #00a6a5;
}

.dim-track {
  margin-top: 10rpx;
  height: 16rpx;
  border-radius: 8rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.dim-bar {
  height: 100%;
  border-radius: 8rpx;
  min-width: 10rpx;
  transition: width 0.5s ease;
}

.dim-comment {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: #9ca3af;
  line-height: 1.6;
}

/* ---------- AI 评价 ---------- */
.ai-summary {
  font-size: 25rpx;
  color: #4b5563;
  line-height: 1.8;
  padding: 20rpx 22rpx;
  background: #f7fbfb;
  border-radius: 12rpx;
  border-left: 6rpx solid #00bebd;
}

.ai-block {
  margin-top: 22rpx;
}

.ai-block-title {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  margin-bottom: 12rpx;
}

.ai-block-title--pro {
  color: #2da44e;
}

.ai-block-title--con {
  color: #f59e0b;
}

.ai-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10rpx;
}

.ai-item-dot {
  flex-shrink: 0;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  margin-top: 4rpx;
}

.ai-item-dot--pro {
  background: #2da44e;
}

.ai-item-dot--con {
  background: #f59e0b;
}

.ai-item-text {
  flex: 1;
  margin-left: 14rpx;
  font-size: 24rpx;
  color: #4b5563;
  line-height: 1.6;
}

/* ---------- 技能 ---------- */
.skill-group {
  margin-bottom: 20rpx;
}

.skill-group:last-child {
  margin-bottom: 0;
}

.skill-group-title {
  display: block;
  font-size: 23rpx;
  color: #6b7280;
  margin-bottom: 12rpx;
}

.skill-group-title--miss {
  color: #e5484d;
}

.skill-wrap {
  margin-bottom: -6rpx;
}

/* ---------- 亮点 ---------- */
.hl-item {
  display: flex;
  align-items: flex-start;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.hl-item:last-child {
  border-bottom: none;
}

.hl-index {
  flex-shrink: 0;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: #e5f7f7;
  color: #00a6a5;
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4rpx;
}

.hl-text {
  flex: 1;
  margin-left: 16rpx;
  font-size: 24rpx;
  color: #4b5563;
  line-height: 1.6;
}

/* ---------- 面试记录 ---------- */
.iv-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f1f4f7;
}

.iv-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.iv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.iv-type {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1d24;
}

.iv-score {
  font-size: 24rpx;
  font-weight: 700;
  color: #00a6a5;
}

.iv-score--none {
  color: #9ca3af;
  font-weight: 500;
}

.iv-meta {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #9ca3af;
}

.iv-report {
  margin-top: 20rpx;
  padding: 20rpx;
  background: #f7fbfb;
  border-radius: 12rpx;
}

.iv-report-summary {
  font-size: 23rpx;
  color: #4b5563;
  line-height: 1.7;
}

.iv-dims {
  display: flex;
  flex-wrap: wrap;
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #eef1f5;
}

.iv-dim {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 14rpx;
}

.iv-dim-name {
  font-size: 20rpx;
  color: #9ca3af;
}

.iv-dim-score {
  margin-top: 6rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #00a6a5;
}

.iv-report-block {
  margin-top: 14rpx;
}

.iv-report-label {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #1a1d24;
  margin-bottom: 8rpx;
}

.iv-report-line {
  display: block;
  font-size: 22rpx;
  color: #6b7280;
  line-height: 1.7;
}

.iv-report-suggest {
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  background: #ffffff;
  border-radius: 10rpx;
  font-size: 22rpx;
  color: #00a6a5;
  line-height: 1.7;
}

.iv-toggle {
  margin-top: 16rpx;
  text-align: center;
  font-size: 22rpx;
  color: #00a6a5;
}

.hr-row-value--accent {
  color: #00a6a5;
}

.hr-empty--sm {
  padding: 40rpx 0;
}

/* ---------- 底部 ---------- */
.bar-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  font-size: 28rpx;
  margin-left: 18rpx;
  background: #ffffff;
  color: #4b5563;
  border: 1rpx solid #e5e9ef;
  padding: 0;
}

.bar-btn::after {
  border: none;
}

.bar-btn:first-child {
  margin-left: 0;
}

.bar-btn--primary {
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
  border-color: transparent;
  box-shadow: 0 6rpx 18rpx rgba(0, 166, 165, 0.24);
}
</style>

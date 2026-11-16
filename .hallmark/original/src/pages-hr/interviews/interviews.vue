<template>
  <view class="hr-page hr-page--plain">
    <!-- Tab -->
    <view class="tab-bar">
      <view
        v-for="tab in TABS"
        :key="tab.value"
        class="tab-item"
        :class="{ 'tab-item--active': active === tab.value }"
        @tap="pickTab(tab.value)"
      >
        {{ tab.label }}
        <text v-if="counts[tab.value]" class="tab-count">{{ counts[tab.value] }}</text>
      </view>
    </view>

    <view v-if="!list.length" class="hr-empty">{{ emptyText }}</view>

    <view v-for="item in list" :key="item.id" class="iv-card">
      <view class="iv-main" @tap="openCandidate(item.candidateId)">
        <view class="iv-head">
          <hr-avatar :name="item.candidateName" :size="88" />
          <view class="iv-info">
            <view class="iv-name-row">
              <text class="iv-name">{{ item.candidateName }}</text>
              <text v-if="item.score" class="iv-score-pill">{{ item.score }} 分</text>
              <text v-else class="iv-score-pill iv-score-pill--gray">{{ statusText(item.status) }}</text>
            </view>
            <text class="iv-pos">{{ item.positionTitle }}</text>
            <text class="iv-meta">{{ item.type }} · {{ item.interviewer }}</text>
          </view>
        </view>

        <view class="iv-time-row">
          <view class="iv-time">
            <svg viewBox="0 0 24 24" class="iv-time-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3.2 2" />
            </svg>
            <text class="iv-time-text">{{ timeLabel(item.scheduledAt) }}</text>
          </view>
          <text class="iv-duration">{{ item.durationMin }} 分钟</text>
        </view>
      </view>

      <view v-if="item.report" class="iv-footer" @tap="toggleReport(item.id)">
        {{ expanded === item.id ? "收起 AI 面试报告" : "查看 AI 面试报告" }}
        <text class="iv-footer-arrow">{{ expanded === item.id ? "▲" : "▼" }}</text>
      </view>

      <view v-if="item.report && expanded === item.id" class="iv-report">
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
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import HrAvatar from "@/components/hr-avatar.vue";
import { getInterviewCounts, getInterviews, type InterviewTab } from "@/hr/api";
import { INTERVIEW_STATUS_TEXT, type InterviewRecord, type InterviewStatus } from "@/hr/types";

const TABS: Array<{ label: string; value: InterviewTab }> = [
  { label: "今日", value: "today" },
  { label: "待安排", value: "upcoming" },
  { label: "已完成", value: "finished" },
];

const active = ref<InterviewTab>("today");
const list = ref<InterviewRecord[]>([]);
const expanded = ref("");

const counts = computed(() => getInterviewCounts());

const emptyText = computed(() => {
  if (active.value === "today") return "今日暂无面试安排";
  if (active.value === "upcoming") return "暂无待安排的面试";
  return "暂无已完成的面试";
});

onLoad((query) => {
  const tab = (query?.tab as InterviewTab) || "";
  if (tab === "today" || tab === "upcoming" || tab === "finished") {
    active.value = tab;
  }
});

onShow(() => {
  load();
  expanded.value = "";
});

async function load() {
  list.value = await getInterviews(active.value);
}

function pickTab(value: InterviewTab) {
  if (active.value === value) return;
  active.value = value;
  expanded.value = "";
  load();
}

function toggleReport(id: string) {
  expanded.value = expanded.value === id ? "" : id;
}

function statusText(value: InterviewStatus): string {
  return INTERVIEW_STATUS_TEXT[value] || value;
}

/** 把「2026-09-03 14:00」转成「今天 14:00 / 明天 10:30 / 09-06 15:00」 */
function timeLabel(value: string): string {
  if (!value) return "";
  const [datePart, timePart] = value.split(" ");
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (datePart === today) return `今天 ${timePart || ""}`;
  const tomorrowDate = new Date(now.getTime() + 86400000);
  const tomorrow = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getDate()).padStart(2, "0")}`;
  if (datePart === tomorrow) return `明天 ${timePart || ""}`;
  return `${datePart.slice(5)} ${timePart || ""}`;
}

function openCandidate(id: string) {
  uni.navigateTo({ url: `/pages-hr/candidate-detail/candidate-detail?id=${encodeURIComponent(id)}` });
}
</script>

<style scoped>
.tab-bar {
  display: flex;
  background: #ffffff;
  padding: 16rpx 20rpx;
  border-bottom: 1rpx solid #eef1f5;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 26rpx;
  color: #6b7280;
  border-radius: 30rpx;
  margin-right: 14rpx;
  background: #f5f7f8;
}

.tab-item:last-child {
  margin-right: 0;
}

.tab-item--active {
  background: #00a6a5;
  color: #ffffff;
  font-weight: 600;
}

.tab-count {
  margin-left: 8rpx;
  font-size: 21rpx;
  opacity: 0.8;
}

.iv-card {
  background: #ffffff;
  border-radius: 18rpx;
  margin: 20rpx 20rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
  overflow: hidden;
}

.iv-main {
  padding: 26rpx 24rpx 20rpx;
}

.iv-head {
  display: flex;
  align-items: center;
}

.iv-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
}

.iv-name-row {
  display: flex;
  align-items: center;
}

.iv-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d24;
}

.iv-score-pill {
  margin-left: 16rpx;
  font-size: 21rpx;
  font-weight: 600;
  color: #00a6a5;
  background: #e5f7f7;
  border-radius: 20rpx;
  padding: 4rpx 14rpx;
}

.iv-score-pill--gray {
  color: #9ca3af;
  background: #f1f4f7;
}

.iv-pos {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #4b5563;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.iv-meta {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #9ca3af;
}

.iv-time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid #f1f4f7;
}

.iv-time {
  display: flex;
  align-items: center;
}

.iv-time-ico {
  width: 30rpx;
  height: 30rpx;
  color: #00a6a5;
  margin-right: 10rpx;
}

.iv-time-text {
  font-size: 26rpx;
  font-weight: 600;
  color: #1a1d24;
}

.iv-duration {
  font-size: 22rpx;
  color: #9ca3af;
}

/* ---------- 报告 ---------- */
.iv-footer {
  padding: 16rpx 24rpx;
  background: #fafbfc;
  border-top: 1rpx solid #f1f4f7;
  font-size: 23rpx;
  color: #00a6a5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iv-footer-arrow {
  margin-left: 10rpx;
  font-size: 18rpx;
}

.iv-report {
  padding: 22rpx 24rpx;
  background: #f7fbfb;
  border-top: 1rpx solid #eef1f5;
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
</style>

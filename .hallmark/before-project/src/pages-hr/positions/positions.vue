<template>
  <view class="hr-page">
    <hr-navbar title="职位管理" :subtitle="`共 ${all.length} 个职位 · 在招 ${openCount} 个`" />

    <!-- 搜索 -->
    <view class="search-wrap">
      <view class="search-bar">
        <svg viewBox="0 0 24 24" class="search-ico" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索职位名称 / 技能"
          :maxlength="40"
          confirm-type="search"
        />
        <text v-if="keyword" class="search-clear" @tap="keyword = ''">✕</text>
      </view>
    </view>

    <!-- 状态筛选 -->
    <scroll-view scroll-x class="tab-scroll" :show-scrollbar="false">
      <view class="tab-track">
        <view
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          class="tab-item"
          :class="{ 'tab-item--active': status === tab.value }"
          @tap="status = tab.value"
        >
          {{ tab.label }}
          <text v-if="countOf(tab.value)" class="tab-count">{{ countOf(tab.value) }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 列表 -->
    <view v-if="loading" class="hr-loading">加载中…</view>
    <view v-else-if="!filtered.length" class="hr-empty">该状态下暂无职位</view>

    <view v-for="position in filtered" :key="position.id" class="pos-card">
      <view class="pos-main" @tap="openDetail(position.id)">
        <view class="pos-head">
          <view class="pos-title-wrap">
            <text class="pos-title">{{ position.title }}</text>
            <view v-if="position.urgent && position.status === 'open'" class="hr-badge hr-badge--urgent">急聘</view>
          </view>
          <view class="hr-badge" :class="badgeClass(position.status)">{{ statusText(position.status) }}</view>
        </view>

        <view class="pos-salary">
          <text class="pos-salary-text">{{ position.salaryMin }}-{{ position.salaryMax }}K</text>
          <text class="pos-meta">{{ position.city }} · {{ position.experience }} · {{ position.education }}</text>
        </view>

        <view class="pos-stats">
          <view class="pos-stat">
            <text class="pos-stat-value">{{ position.stats.views }}</text>
            <text class="pos-stat-label">曝光</text>
          </view>
          <view class="pos-stat">
            <text class="pos-stat-value">{{ position.stats.applicants }}</text>
            <text class="pos-stat-label">投递</text>
          </view>
          <view class="pos-stat">
            <text class="pos-stat-value">{{ position.stats.interviewing }}</text>
            <text class="pos-stat-label">面试</text>
          </view>
          <view class="pos-stat">
            <text class="pos-stat-value" style="color: #2da44e">{{ position.hiredCount }}/{{ position.headcount }}</text>
            <text class="pos-stat-label">已招/需求</text>
          </view>
        </view>

        <view class="pos-progress">
          <view class="pos-track">
            <view class="pos-bar" :style="{ width: progressWidth(position) + '%' }"></view>
          </view>
        </view>

        <view class="pos-skills">
          <text v-for="skill in position.skills.slice(0, 4)" :key="skill" class="hr-tag">{{ skill }}</text>
          <text v-if="position.skills.length > 4" class="hr-tag">+{{ position.skills.length - 4 }}</text>
        </view>

        <view class="pos-foot">
          <text class="pos-time">更新于 {{ position.updatedAt.slice(5) }} · {{ position.owner }}</text>
        </view>
      </view>

      <!-- 操作区 -->
      <view class="pos-actions">
        <text v-if="position.status === 'open'" class="pos-btn" @tap="refreshPosition(position)">刷新</text>
        <text class="pos-btn" @tap="editPosition(position.id)">编辑</text>
        <text v-if="position.status === 'open'" class="pos-btn" @tap="changeStatus(position, 'paused')">暂停招聘</text>
        <text v-if="position.status === 'paused'" class="pos-btn pos-btn--primary" @tap="changeStatus(position, 'open')">恢复招聘</text>
        <text v-if="position.status === 'closed'" class="pos-btn pos-btn--primary" @tap="changeStatus(position, 'open')">重新发布</text>
        <text v-if="position.status === 'draft'" class="pos-btn pos-btn--primary" @tap="changeStatus(position, 'open')">立即发布</text>
        <text v-if="position.status === 'open'" class="pos-btn pos-btn--danger" @tap="changeStatus(position, 'closed')">关闭</text>
      </view>
    </view>

    <view class="hr-fab" @tap="createPosition">+</view>

    <hr-tabbar active="positions" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { onShow } from "@dcloudio/uni-app";
import HrNavbar from "@/components/hr-navbar.vue";
import HrTabbar from "@/components/hr-tabbar.vue";
import { getPositions, updatePositionStatus } from "@/hr/api";
import { hrState, todayLabel } from "@/hr/store";
import { POSITION_STATUS_TEXT, type HrPosition, type PositionStatus } from "@/hr/types";

type StatusFilter = PositionStatus | "all";

const STATUS_TABS: Array<{ label: string; value: StatusFilter }> = [
  { label: "全部", value: "all" },
  { label: "招聘中", value: "open" },
  { label: "已暂停", value: "paused" },
  { label: "已关闭", value: "closed" },
  { label: "草稿", value: "draft" },
];

const status = ref<StatusFilter>("all");
const keyword = ref("");
const loading = ref(false);
const list = ref<HrPosition[]>([]);

/** 直接从 store 读取，保证其他页面改动后回来能立即看到最新状态 */
const all = computed(() => hrState.positions);

const openCount = computed(() => all.value.filter((item) => item.status === "open").length);

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return all.value.filter((item) => {
    if (status.value !== "all" && item.status !== status.value) return false;
    if (!kw) return true;
    return (
      item.title.toLowerCase().includes(kw) ||
      item.field.toLowerCase().includes(kw) ||
      item.city.toLowerCase().includes(kw) ||
      item.skills.some((skill) => skill.toLowerCase().includes(kw))
    );
  });
});

function countOf(value: StatusFilter): number {
  return value === "all" ? all.value.length : all.value.filter((item) => item.status === value).length;
}

watch(status, () => load());

onShow(() => {
  load();
});

async function load() {
  loading.value = true;
  try {
    list.value = await getPositions(status.value);
  } finally {
    loading.value = false;
  }
}

function statusText(value: PositionStatus): string {
  return POSITION_STATUS_TEXT[value] || value;
}

function badgeClass(value: PositionStatus): string {
  return `hr-badge--${value}`;
}

function progressWidth(position: HrPosition): number {
  if (!position.headcount) return 0;
  return Math.min(Math.max((position.hiredCount / position.headcount) * 100, 4), 100);
}

async function refreshPosition(position: HrPosition) {
  const target = hrState.positions.find((item) => item.id === position.id);
  if (target) target.updatedAt = todayLabel();
  uni.showToast({ title: "职位已刷新", icon: "success" });
}

async function changeStatus(position: HrPosition, next: PositionStatus) {
  const label = next === "open" ? "发布" : next === "paused" ? "暂停" : "关闭";
  uni.showModal({
    title: `确认${label}职位`,
    content: `职位「${position.title}」将被${label}，是否继续？`,
    success: async (res) => {
      if (!res.confirm) return;
      await updatePositionStatus(position.id, next);
      uni.showToast({ title: `已${label}`, icon: "success" });
      load();
    },
  });
}

function createPosition() {
  uni.navigateTo({ url: "/pages-hr/position-edit/position-edit" });
}

function editPosition(id: string) {
  uni.navigateTo({ url: `/pages-hr/position-edit/position-edit?id=${encodeURIComponent(id)}` });
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages-hr/position-detail/position-detail?id=${encodeURIComponent(id)}` });
}
</script>

<style scoped>
.search-wrap {
  padding: 20rpx 20rpx 4rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 76rpx;
  background: #ffffff;
  border-radius: 38rpx;
  padding: 0 26rpx;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
}

.search-ico {
  width: 32rpx;
  height: 32rpx;
  color: #9ca3af;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  margin-left: 14rpx;
  font-size: 26rpx;
  color: #1a1d24;
}

.search-clear {
  color: #c2c9d6;
  font-size: 26rpx;
  padding-left: 16rpx;
}

/* ---------- 状态 Tab ---------- */
.tab-scroll {
  width: 100%;
  white-space: nowrap;
  padding: 18rpx 0 6rpx;
}

.tab-track {
  display: inline-flex;
  padding: 0 20rpx;
}

.tab-item {
  display: inline-block;
  padding: 12rpx 30rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background: #ffffff;
  font-size: 25rpx;
  color: #6b7280;
  border: 1rpx solid #eef1f5;
}

.tab-item--active {
  background: #00a6a5;
  color: #ffffff;
  border-color: #00a6a5;
  font-weight: 600;
}

.tab-count {
  margin-left: 8rpx;
  font-size: 21rpx;
  opacity: 0.75;
}

/* ---------- 职位卡片 ---------- */
.pos-card {
  background: #ffffff;
  border-radius: 18rpx;
  margin: 20rpx 20rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(15, 40, 45, 0.04);
  overflow: hidden;
}

.pos-main {
  padding: 26rpx 24rpx 18rpx;
}

.pos-head {
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
  font-size: 31rpx;
  font-weight: 700;
  color: #1a1d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380rpx;
}

.pos-salary {
  margin-top: 12rpx;
  display: flex;
  align-items: baseline;
}

.pos-salary-text {
  font-size: 29rpx;
  font-weight: 700;
  color: #ff7a45;
}

.pos-meta {
  margin-left: 18rpx;
  font-size: 22rpx;
  color: #6b7280;
}

.pos-stats {
  display: flex;
  margin-top: 22rpx;
  padding: 18rpx 0;
  border-top: 1rpx solid #f1f4f7;
  border-bottom: 1rpx solid #f1f4f7;
}

.pos-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pos-stat-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d24;
}

.pos-stat-label {
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #9ca3af;
}

.pos-progress {
  margin-top: 18rpx;
}

.pos-track {
  height: 12rpx;
  border-radius: 6rpx;
  background: #f1f4f7;
  overflow: hidden;
}

.pos-bar {
  height: 100%;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #00bebd 0%, #00a6a5 100%);
  transition: width 0.5s ease;
  min-width: 10rpx;
}

.pos-skills {
  margin-top: 18rpx;
  margin-bottom: -6rpx;
}

.pos-foot {
  margin-top: 14rpx;
}

.pos-time {
  font-size: 21rpx;
  color: #9ca3af;
}

/* ---------- 操作区 ---------- */
.pos-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16rpx 24rpx;
  background: #fafbfc;
  border-top: 1rpx solid #f1f4f7;
}

.pos-btn {
  margin-left: 16rpx;
  padding: 10rpx 28rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #6b7280;
  background: #ffffff;
  border: 1rpx solid #e5e9ef;
}

.pos-btn--primary {
  color: #ffffff;
  background: #00a6a5;
  border-color: #00a6a5;
}

.pos-btn--danger {
  color: #e5484d;
  border-color: rgba(229, 72, 77, 0.3);
}
</style>

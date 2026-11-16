<template>
  <view class="admin-page">
    <admin-navbar title="候选复核" :subtitle="`待复核 ${pendingCount}`" />

    <view class="filter-row">
      <view
        v-for="opt in FILTERS"
        :key="opt.value"
        class="filter-item"
        :class="{ active: filter === opt.value }"
        @tap="changeFilter(opt.value)"
      >{{ opt.label }}</view>
    </view>

    <view v-if="loading && !items.length" class="admin-loading">加载中…</view>

    <view v-if="items.length" class="list">
      <view
        v-for="item in items"
        :key="item.id"
        class="rv-item"
        @tap="openDetail(item.id)"
      >
        <view class="rv-top">
          <text class="rv-role">{{ item.roleName }}</text>
          <text class="rv-status" :class="statusClass(item.status)">{{ statusText(item.status) }}</text>
        </view>
        <view class="rv-tags">
          <text class="rv-type">{{ typeText(item.candidateType) }}</text>
          <text class="rv-evidence" :class="evidenceClass(item.evidenceClass)">{{ item.evidenceLabel }}</text>
        </view>
        <view class="rv-foot">
          <text class="rv-def">{{ defSummary(item.definition) }}</text>
          <text class="rv-arrow">›</text>
        </view>
      </view>

      <view v-if="hasMore" class="load-more" @tap="loadMore">加载更多</view>
      <view v-else class="list-end">共 {{ total }} 条候选</view>
    </view>

    <view v-else-if="!loading" class="empty">
      <text v-if="filter === 'pending'">🎉 全部候选已复核完成</text>
      <text v-else>暂无候选</text>
    </view>

    <admin-tabbar active="reviews" />
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onPullDownRefresh, onShow } from "@dcloudio/uni-app";
import AdminNavbar from "@/components/admin-navbar.vue";
import AdminTabbar from "@/components/admin-tabbar.vue";
import { getReviews } from "@/admin/api";
import { adminState } from "@/admin/store";
import type { CandidateType, ReviewItem, ReviewStatus } from "@/admin/types";

const items = ref<ReviewItem[]>([]);
const loading = ref(false);
const filter = ref<"pending" | "approved" | "rejected" | "all">("pending");
const total = ref(0);

const FILTERS = [
  { label: "待复核", value: "pending" as const },
  { label: "已批准", value: "approved" as const },
  { label: "已驳回", value: "rejected" as const },
  { label: "全部", value: "all" as const },
];

const hasMore = computed(() => items.value.length < total.value);
const pendingCount = computed(() => adminState.pendingReviews);

function statusText(s: ReviewStatus): string {
  return ({ pending: "待复核", approved: "已批准", rejected: "已驳回" } as Record<string, string>)[s] || s;
}
function statusClass(s: ReviewStatus): string {
  return ({ pending: "st-pending", approved: "st-approved", rejected: "st-rejected" } as Record<string, string>)[s] || "";
}
function typeText(t: CandidateType): string {
  return ({ new_role: "新岗位发现", skill_change: "岗位能力变化", definition_update: "岗位定义更新" } as Record<string, string>)[t] || t;
}
function evidenceClass(c: string): string {
  return ({ data_backed: "ev-backed", curated: "ev-curated", aggregated: "ev-aggregated" } as Record<string, string>)[c] || "";
}
function defSummary(def: ReviewItem["definition"]): string {
  const resp = (def.core_responsibilities || []).length;
  const req = (def.required_skills || []).length;
  const bonus = (def.bonus_skills || []).length;
  return `职责 ${resp} · 必备技能 ${req} · 加分技能 ${bonus}`;
}

async function load(reset = true) {
  loading.value = true;
  try {
    const result = await getReviews(filter.value);
    total.value = result.length;
    items.value = reset ? result : [...items.value, ...result];
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "加载失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}

function changeFilter(value: typeof filter.value) {
  if (filter.value === value) return;
  filter.value = value;
  load(true);
}

function loadMore() {
  if (hasMore.value) load(false);
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages-admin/reviews/review-detail?id=${encodeURIComponent(id)}` });
}

onShow(() => {
  load(true);
});

onPullDownRefresh(async () => {
  await load(true);
  uni.stopPullDownRefresh();
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 140rpx;
  box-sizing: border-box;
}

.filter-row {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 20rpx 0;
}

.filter-item {
  padding: 10rpx 28rpx;
  background: #ffffff;
  border-radius: 28rpx;
  font-size: 24rpx;
  color: #6b7280;
  box-shadow: 0 2rpx 8rpx rgba(15, 40, 45, 0.03);
}

.filter-item.active {
  background: #2b6cb0;
  color: #ffffff;
  font-weight: 600;
}

.list {
  padding: 16rpx 20rpx 0;
}

.rv-item {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(15, 40, 45, 0.04);
}

.rv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rv-role {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 420rpx;
}

.rv-status {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.st-pending { background: #fff3e0; color: #d97706; }
.st-approved { background: #e8f6ee; color: #2da44e; }
.st-rejected { background: #fdeaea; color: #e5484d; }

.rv-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
}

.rv-type {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
  background: #eef2f7;
  color: #2b6cb0;
}

.rv-evidence {
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 16rpx;
}

.ev-backed { background: #e8f6ee; color: #2da44e; }
.ev-curated { background: #f3ecff; color: #8b5cf6; }
.ev-aggregated { background: #e8f0fa; color: #3b82f6; }

.rv-foot {
  margin-top: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rv-def {
  flex: 1;
  min-width: 0;
  font-size: 22rpx;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rv-arrow {
  color: #c2c9d6;
  font-size: 34rpx;
  margin-left: 12rpx;
}

.load-more {
  text-align: center;
  color: #2b6cb0;
  font-size: 25rpx;
  padding: 24rpx 0;
}

.list-end {
  text-align: center;
  color: #9ca3af;
  font-size: 22rpx;
  padding: 24rpx 0;
}

.admin-loading {
  text-align: center;
  color: #8a94a6;
  padding: 80rpx 0;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: #9ca3af;
  font-size: 27rpx;
  padding: 120rpx 0;
}
</style>

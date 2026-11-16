<template>
  <view class="admin-page">
    <admin-navbar title="候选复核" :subtitle="`待复核 ${pendingCount}`" />

    <view class="filter-row">
      <view role="button" tabindex="0"
        v-for="opt in FILTERS"
        :key="opt.value"
        class="filter-item"
        :class="{ active: filter === opt.value }"
        @tap="changeFilter(opt.value)"
       @keydown.enter.prevent.stop="changeFilter(opt.value)" @keydown.space.prevent.stop="changeFilter(opt.value)">{{ opt.label }}</view>
    </view>

    <view v-if="loading && !items.length" class="admin-loading">加载中…</view>

    <view v-if="items.length" class="list">
      <view role="button" tabindex="0"
        v-for="item in items"
        :key="item.id"
        class="rv-item"
        @tap="openDetail(item.id)"
       @keydown.enter.prevent.stop="openDetail(item.id)" @keydown.space.prevent.stop="openDetail(item.id)">
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
          <AppIcon class="rv-arrow" name="chevron-right" />
        </view>
      </view>

      <view role="button" tabindex="0" v-if="hasMore" class="load-more" @tap="loadMore" @keydown.enter.prevent.stop="loadMore" @keydown.space.prevent.stop="loadMore">加载更多</view>
      <view v-else class="list-end">共 {{ total }} 条候选</view>
    </view>

    <view v-else-if="!loading" class="empty">
      <text v-if="filter === 'pending'">全部候选已复核完成</text>
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
  return `职责 ${resp}　必备技能 ${req}　加分技能 ${bonus}`;
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-page { min-height: 100vh; background: var(--color-surface); padding-bottom: calc(140rpx + env(safe-area-inset-bottom)); box-sizing: border-box; }

.filter-row { display: flex; align-items: center; gap: 40rpx; padding: 0 32rpx; background: var(--color-paper); border-bottom: 1rpx solid var(--color-rule); overflow-x: auto; }

.filter-item { padding: 24rpx 0; min-height: 44rpx; background: transparent; border-radius: 0; border-bottom: 4rpx solid transparent; font-size: 28rpx; color: var(--color-secondary); white-space: nowrap; box-shadow: none; }

.filter-item.active { background: transparent; color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 600; }

.list { padding: 0; background: var(--color-paper); }

.rv-item { background: var(--color-paper); border-radius: 0; padding: 32rpx; margin: 0; border-bottom: 12rpx solid var(--color-surface); box-shadow: none; }

.rv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rv-role {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--color-ink);
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

.st-pending { background: var(--color-surface); color: var(--color-warning); }
.st-approved { background: var(--color-surface); color: var(--color-success); }
.st-rejected { background: var(--color-surface); color: var(--color-danger); }

.rv-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 14rpx;
}

.rv-type { font-size: 24rpx; padding: 6rpx 12rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }

.rv-evidence { font-size: 24rpx; padding: 6rpx 12rpx; border-radius: 4rpx; background: var(--color-surface); color: var(--color-secondary); }

.ev-backed { background: var(--color-surface); color: var(--color-success); }
.ev-curated { background: var(--color-surface); color: var(--color-primary); }
.ev-aggregated { background: var(--color-primary-soft); color: var(--color-primary); }

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
  color: var(--color-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rv-arrow {
  color: var(--color-rule);
  font-size: 34rpx;
  margin-left: 12rpx;
}

.load-more {
  text-align: center;
  color: var(--color-primary);
  font-size: 25rpx;
  padding: 24rpx 0;
}

.list-end {
  text-align: center;
  color: var(--color-muted);
  font-size: 22rpx;
  padding: 24rpx 0;
}

.admin-loading {
  text-align: center;
  color: var(--color-muted);
  padding: 80rpx 0;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: var(--color-muted);
  font-size: 27rpx;
  padding: 120rpx 0;
}
</style>

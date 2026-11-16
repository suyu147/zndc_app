<template>
  <view class="hr-tabbar">
    <view class="hr-tabbar-inner">
      <view
        v-for="tab in TABS"
        :key="tab.key"
        class="hr-tab"
        :class="{ 'hr-tab--active': active === tab.key }"
        @tap="onTap(tab)"
       role="button" tabindex="0" @keydown.enter.prevent.stop="onTap(tab)" @keydown.space.prevent.stop="onTap(tab)">
        <view class="hr-tab-icon">
          <!-- 工作台：九宫格 -->
          <AppIcon v-if="tab.key === 'workbench'" class="ico" name="home" :size="44" />

          <!-- 职位：公文包 -->
          <AppIcon v-else-if="tab.key === 'positions'" class="ico" name="briefcase" :size="44" />

          <!-- 候选人：多人 -->
          <AppIcon v-else-if="tab.key === 'candidates'" class="ico" name="users" :size="44" />

          <!-- 洞察：柱状图 -->
          <AppIcon v-else-if="tab.key === 'insight'" class="ico" name="chart" :size="44" />

          <!-- 我的：个人 -->
          <AppIcon v-else class="ico" name="user" :size="44" />

          <view v-if="badgeOf(tab.key)" class="hr-tab-badge">{{ badgeOf(tab.key) }}</view>
        </view>
        <text class="hr-tab-label">{{ tab.label }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * HR 端自建底部导航
 *
 * HR 页面不在 pages.json 的全局 tabBar 中（全局 tabBar 属于求职端），
 * 因此这里自建一套 5 Tab 导航，切换使用 reLaunch 以保证页面栈干净。
 */
import { computed } from "vue";
import { hrState } from "@/hr/store";

export type HrTabKey = "workbench" | "positions" | "candidates" | "insight" | "mine";

interface HrTab {
  key: HrTabKey;
  label: string;
  path: string;
}

const TABS: HrTab[] = [
  { key: "workbench", label: "工作台", path: "/pages-hr/workbench/workbench" },
  { key: "positions", label: "职位", path: "/pages-hr/positions/positions" },
  { key: "candidates", label: "候选人", path: "/pages-hr/candidates/candidates" },
  { key: "insight", label: "洞察", path: "/pages-hr/insight/insight" },
  { key: "mine", label: "我的", path: "/pages-hr/mine/mine" },
];

const props = defineProps<{ active: HrTabKey }>();

/** 候选人 Tab 上显示待处理简历数 */
const pendingResumes = computed(() => hrState.candidates.filter((item) => item.stage === "new").length);

const badges = computed<Record<string, number>>(() => ({ candidates: pendingResumes.value }));

function badgeOf(key: HrTabKey): number {
  return badges.value[key] || 0;
}

function onTap(tab: HrTab) {
  if (tab.key === props.active) return;
  uni.reLaunch({ url: tab.path });
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */
.hr-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 900;
  background: var(--color-paper);
  border-top: 1rpx solid var(--color-surface);
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: none;
}

.hr-tabbar-inner {
  display: flex;
  height: 108rpx;
}

.hr-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.hr-tab-icon {
  position: relative;
  width: 44rpx;
  height: 44rpx;
  color: var(--color-rule);
  transition: color 0.18s ease;
}

.hr-tab--active .hr-tab-icon {
  color: var(--color-primary);
}

.ico {
  width: 44rpx;
  height: 44rpx;
  display: block;
}

.hr-tab-label {
  margin-top: 4rpx;
  font-size: 20rpx;
  color: var(--color-muted);
  line-height: 1;
}

.hr-tab--active .hr-tab-label {
  color: var(--color-primary);
  font-weight: 600;
}

.hr-tab-badge {
  position: absolute;
  top: -6rpx;
  left: 30rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 7rpx;
  box-sizing: border-box;
  border-radius: 15rpx;
  background: var(--color-danger);
  color: var(--color-paper);
  font-size: 19rpx;
  line-height: 30rpx;
  text-align: center;
  font-weight: 600;
  border: 2rpx solid var(--color-paper);
}

.hr-tabbar-inner { height: 104rpx; }
.hr-tab-label { font-size: 22rpx; line-height: 1.2; }
.hr-tab-icon { color: var(--color-muted); }

</style>

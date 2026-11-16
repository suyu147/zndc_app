<template>
  <view class="admin-navbar-wrap">
    <view class="admin-navbar" :class="{ 'admin-navbar--plain': plain }">
      <view class="admin-navbar-inner">
        <view class="admin-navbar-side admin-navbar-left">
          <view role="button" tabindex="0" v-if="back" class="admin-navbar-back" @tap="onBack" @keydown.enter.prevent.stop="onBack" @keydown.space.prevent.stop="onBack">
            <AppIcon  class="admin-navbar-back-ico" name="chevron-left" />
          </view>
          <slot v-else name="left" />
        </view>

        <view role="button" tabindex="0" class="admin-navbar-center" @tap="$emit('titleTap')" @keydown.enter.prevent.stop="$emit('titleTap')" @keydown.space.prevent.stop="$emit('titleTap')">
          <text class="admin-navbar-title">{{ title }}</text>
          <text v-if="subtitle" class="admin-navbar-subtitle">{{ subtitle }}</text>
        </view>

        <view class="admin-navbar-side admin-navbar-right">
          <slot name="right" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 治理管理员端自定义导航栏
 * 用于 pages.json 中 navigationStyle: custom 的治理页面。
 * 与三端共用青绿色交互和白色导航。
 */
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    /** 是否显示返回箭头 */
    back?: boolean;
    /** 浅色模式：白底黑字 */
    plain?: boolean;
  }>(),
  { title: "", subtitle: "", back: false, plain: false },
);

const emit = defineEmits<{ (e: "back"): void; (e: "titleTap"): void }>();

function onBack() {
  emit("back");
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.reLaunch({ url: "/pages-admin/dashboard/dashboard" });
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · v2.0.0 · redesign: full · shape: app screen · theme: project teal · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; retained familiar mobile list navigation, removed gradient cards. */
.admin-navbar-wrap { height: calc(var(--status-bar-height, 0px) + 104rpx); width: 100%; }

.admin-navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 999; padding-top: var(--status-bar-height, var(--space-0px)); background: var(--color-paper); border-bottom: 1rpx solid var(--color-rule); }

.admin-navbar--plain {
  background: var(--color-paper);
  border-bottom: 1rpx solid var(--color-surface);
}

.admin-navbar-inner { height: 104rpx; display: flex; align-items: center; gap: 16rpx; padding: 0 32rpx; }

.admin-navbar-side { min-width: 0; display: flex; align-items: center; }

.admin-navbar-left {
  justify-content: flex-start;
}

.admin-navbar-right {
  justify-content: flex-end;
}

.admin-navbar-back { width: 64rpx; height: 88rpx; margin-left: -16rpx; display: flex; align-items: center; justify-content: center; color: var(--color-ink); }

.admin-navbar-back-ico {
  width: 40rpx;
  height: 40rpx;
}

.admin-navbar-center { flex: 1; min-width: 0; text-align: left; overflow: hidden; }

.admin-navbar-title { display: block; font-size: 38rpx; font-weight: 600; color: var(--color-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.admin-navbar--plain .admin-navbar-title {
  color: var(--color-ink);
}

.admin-navbar-subtitle { display: block; margin-top: 4rpx; font-size: 23rpx; color: var(--color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.admin-navbar--plain .admin-navbar-subtitle {
  color: var(--color-muted);
}
</style>

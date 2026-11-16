<template>
  <view class="hr-navbar-wrap">
    <view class="hr-navbar" :class="{ 'hr-navbar--plain': plain }">
      <view class="hr-navbar-inner">
        <view class="hr-navbar-side hr-navbar-left">
          <view v-if="back" class="hr-navbar-back" @tap="onBack" role="button" tabindex="0" @keydown.enter.prevent.stop="onBack" @keydown.space.prevent.stop="onBack">
            <svg aria-hidden="true" viewBox="0 0 24 24" class="hr-navbar-back-ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </view>
          <slot v-else name="left" />
        </view>

        <view class="hr-navbar-center" @tap="$emit('titleTap')" role="button" tabindex="0" @keydown.enter.prevent.stop="$emit('titleTap')" @keydown.space.prevent.stop="$emit('titleTap')">
          <text class="hr-navbar-title">{{ title }}</text>
          <text v-if="subtitle" class="hr-navbar-subtitle">{{ subtitle }}</text>
        </view>

        <view class="hr-navbar-side hr-navbar-right">
          <slot name="right" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * HR 端自定义导航栏
 * 用于 pages.json 中 navigationStyle: custom 的页面（HR 五大 Tab 页）。
 * 固定定位 + 同高占位块，页面内直接置顶使用即可，无需手动补 padding。
 * 白色导航栏，统一招聘端的信息层级。
 */
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    /** 是否显示返回箭头 */
    back?: boolean;
    /** 浅色模式：白底黑字，用于需要突出内容的页面 */
    plain?: boolean;
  }>(),
  { title: "", subtitle: "", back: false, plain: false },
);

const emit = defineEmits<{ (e: "back"): void; (e: "titleTap"): void }>();

function onBack() {
  emit("back");
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack();
  else uni.reLaunch({ url: "/pages-hr/workbench/workbench" });
}
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */
.hr-navbar-wrap {
  height: calc(var(--status-bar-height, 0px) + 88rpx);
  width: 100%;
}

.hr-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding-top: var(--status-bar-height, var(--space-0px));
  background: var(--color-primary);
}

.hr-navbar--plain {
  background: var(--color-paper);
  border-bottom: 1rpx solid var(--color-surface);
}

.hr-navbar-inner {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.hr-navbar-side {
  min-width: 120rpx;
  display: flex;
  align-items: center;
}

.hr-navbar-left {
  justify-content: flex-start;
}

.hr-navbar-right {
  justify-content: flex-end;
}

.hr-navbar-back {
  width: 56rpx;
  height: 56rpx;
  margin-left: -14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-paper);
}

.hr-navbar-back-ico {
  width: 40rpx;
  height: 40rpx;
}

.hr-navbar-center {
  flex: 1;
  min-width: 0;
  text-align: center;
  overflow: hidden;
}

.hr-navbar-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-paper);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hr-navbar--plain .hr-navbar-title {
  color: var(--color-ink);
}

.hr-navbar-subtitle {
  display: block;
  margin-top: 2rpx;
  font-size: 20rpx;
  color: var(--color-paper);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hr-navbar--plain .hr-navbar-subtitle {
  color: var(--color-muted);
}

.hr-navbar, .hr-navbar--plain { background: var(--color-paper); border-bottom: 1rpx solid var(--color-rule); }
.hr-navbar-inner { padding: 0 32rpx; }
.hr-navbar-title, .hr-navbar-back { color: var(--color-ink); }
.hr-navbar-subtitle { color: var(--color-muted); font-size: 22rpx; }
.hr-navbar-title { font-size: 34rpx; font-weight: 600; }
.hr-navbar-side { min-width: 88rpx; }

</style>

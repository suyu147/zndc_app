<template>
  <view class="hr-navbar-wrap">
    <view class="hr-navbar" :class="{ 'hr-navbar--plain': plain }">
      <view class="hr-navbar-inner">
        <view class="hr-navbar-side hr-navbar-left">
          <view v-if="back" class="hr-navbar-back" @tap="onBack">
            <svg viewBox="0 0 24 24" class="hr-navbar-back-ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </view>
          <slot v-else name="left" />
        </view>

        <view class="hr-navbar-center" @tap="$emit('titleTap')">
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
 * 渐变自 #0A444C 过渡到 #0E6E75，工作台页的 hero 会从 #0E6E75 接续，形成连贯大渐变。
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
  padding-top: var(--status-bar-height, 0px);
  background: linear-gradient(180deg, #0a444c 0%, #0e6e75 100%);
}

.hr-navbar--plain {
  background: #ffffff;
  border-bottom: 1rpx solid #eef1f5;
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
  color: #ffffff;
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
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hr-navbar--plain .hr-navbar-title {
  color: #1a1d24;
}

.hr-navbar-subtitle {
  display: block;
  margin-top: 2rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hr-navbar--plain .hr-navbar-subtitle {
  color: #9ca3af;
}
</style>

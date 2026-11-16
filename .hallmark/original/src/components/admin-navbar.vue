<template>
  <view class="admin-navbar-wrap">
    <view class="admin-navbar" :class="{ 'admin-navbar--plain': plain }">
      <view class="admin-navbar-inner">
        <view class="admin-navbar-side admin-navbar-left">
          <view v-if="back" class="admin-navbar-back" @tap="onBack">
            <svg viewBox="0 0 24 24" class="admin-navbar-back-ico" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </view>
          <slot v-else name="left" />
        </view>

        <view class="admin-navbar-center" @tap="$emit('titleTap')">
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
 * 治理主题色：深蓝 #15324F → #1E4D75，与 HR 端的青绿、求职端区分。
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
.admin-navbar-wrap {
  height: calc(var(--status-bar-height, 0px) + 88rpx);
  width: 100%;
}

.admin-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  padding-top: var(--status-bar-height, 0px);
  background: linear-gradient(180deg, #15324f 0%, #1e4d75 100%);
}

.admin-navbar--plain {
  background: #ffffff;
  border-bottom: 1rpx solid #eef1f5;
}

.admin-navbar-inner {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
}

.admin-navbar-side {
  min-width: 120rpx;
  display: flex;
  align-items: center;
}

.admin-navbar-left {
  justify-content: flex-start;
}

.admin-navbar-right {
  justify-content: flex-end;
}

.admin-navbar-back {
  width: 56rpx;
  height: 56rpx;
  margin-left: -14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.admin-navbar-back-ico {
  width: 40rpx;
  height: 40rpx;
}

.admin-navbar-center {
  flex: 1;
  min-width: 0;
  text-align: center;
  overflow: hidden;
}

.admin-navbar-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-navbar--plain .admin-navbar-title {
  color: #1a1d24;
}

.admin-navbar-subtitle {
  display: block;
  margin-top: 2rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.65);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-navbar--plain .admin-navbar-subtitle {
  color: #9ca3af;
}
</style>

<template>
  <view class="page">
    <view class="header">
      <view class="avatar">{{ roleEmoji }}</view>
      <view class="user-name">{{ user?.displayName || "未登录" }}</view>
      <view class="user-role">{{ roleName }}</view>
    </view>

    <view class="card menu-card">
      <view class="cell" @tap="goFavorites">
        <view class="cell-left">
          <view class="cell-icon icon-fav">★</view>
          <text>我的收藏</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">收藏的岗位</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="checkHealth">
        <view class="cell-left">
          <view class="cell-icon icon-status">●</view>
          <text>服务状态</text>
        </view>
        <view class="cell-right">
          <text :class="healthClass">{{ healthText }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="cell">
        <view class="cell-left">
          <view class="cell-icon icon-server">☁</view>
          <text>服务器</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">www.zndc.art</text>
        </view>
      </view>
      <view class="cell">
        <view class="cell-left">
          <view class="cell-icon icon-version">ℹ</view>
          <text>版本</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">v1.1.0</text>
        </view>
      </view>
    </view>

    <view class="card menu-card">
      <view class="cell" @tap="goHrPortal">
        <view class="cell-left">
          <view class="cell-icon icon-hr">🏢</view>
          <text>切换到 HR 端</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">招聘工作台</text>
          <text class="arrow">›</text>
        </view>
      </view>
      <view class="cell" @tap="relogin">
        <view class="cell-left">
          <view class="cell-icon icon-switch">⇄</view>
          <text>切换账号</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="cell logout" @tap="logout">
        <view class="cell-left">
          <view class="cell-icon icon-logout">↵</view>
          <text>退出登录</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { clearSession, readSession, requireLogin } from "@/api/request";
import { switchPortal } from "@/utils/portal";

const user = ref(readSession()?.user || null);
const healthText = ref("点击检测");
const healthClass = ref("");

const roleEmoji = computed(() => {
  if (user.value?.role === "enterprise") return "🏢";
  if (user.value?.role === "admin") return "🛡️";
  return "🎯";
});

const roleName = computed(() => {
  if (user.value?.role === "enterprise") return "企业 HR";
  if (user.value?.role === "admin") return "治理管理员";
  if (user.value?.role === "personal") return "个人用户";
  return "—";
});

onShow(() => {
  if (requireLogin()) return;
  user.value = readSession()?.user || null;
});

async function checkHealth() {
  healthText.value = "检测中…";
  healthClass.value = "";
  try {
    const result = await api.health();
    healthText.value = result.status === "healthy" ? "正常运行" : "服务降级";
    healthClass.value = result.status === "healthy" ? "ok" : "warn";
  } catch {
    healthText.value = "不可用";
    healthClass.value = "err";
  }
}

function relogin() {
  clearSession();
  uni.reLaunch({ url: "/pages/login/login" });
}

function goFavorites() {
  uni.navigateTo({ url: "/pages/favorites/favorites" });
}

function goHrPortal() {
  uni.showModal({
    title: "切换到 HR 端",
    content: "将进入招聘方工作台，可随时切回求职端。",
    success: (res) => {
      if (res.confirm) switchPortal();
    },
  });
}

function logout() {
  uni.showModal({
    title: "退出登录",
    content: "确定退出当前账号吗？",
    success: (res) => {
      if (!res.confirm) return;
      clearSession();
      uni.reLaunch({ url: "/pages/login/login" });
    },
  });
}
</script>

<style scoped>
.page {
  padding-bottom: 60rpx;
}

.header {
  background: linear-gradient(180deg, #00bebd 0%, #00a6a5 100%);
  padding: 60rpx 0 80rpx;
  text-align: center;
  color: #ffffff;
  border-bottom-left-radius: 32rpx;
  border-bottom-right-radius: 32rpx;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.24);
  margin: 0 auto 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 700;
}

.user-role {
  display: inline-block;
  margin-top: 14rpx;
  font-size: 24rpx;
  padding: 6rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.16);
}

.menu-card {
  margin-top: 24rpx;
}

.cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 26rpx 0;
  border-bottom: 1rpx solid #f2f4f7;
  font-size: 29rpx;
}

.cell:last-child {
  border-bottom: none;
}

.cell-left {
  display: flex;
  align-items: center;
}

.cell-icon {
  width: 52rpx;
  height: 52rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  margin-right: 20rpx;
}

.icon-status {
  background: #e6f4ea;
  color: #2da44e;
}
.icon-fav {
  background: #e5f7f7;
  color: #00bebd;
}
.icon-server {
  background: #e5f7f7;
  color: #00bebd;
}
.icon-hr {
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  color: #ffffff;
}
.icon-version {
  background: #e5f7f7;
  color: #00bebd;
}
.icon-switch {
  background: #f5f6f8;
  color: #6b6f74;
}
.icon-logout {
  background: #fdecec;
  color: #e5484d;
}

.cell-right {
  display: flex;
  align-items: center;
}

.cell-value {
  color: #8a94a6;
  font-size: 26rpx;
}

.cell .ok {
  color: #2da44e;
}
.cell .warn {
  color: #f59e0b;
}
.cell .err {
  color: #e5484d;
}

.arrow {
  color: #c2c9d6;
  font-size: 34rpx;
  margin-left: 8rpx;
}

.cell.logout {
  color: #e5484d;
}
.cell.logout .arrow {
  color: #e5484d;
}
</style>

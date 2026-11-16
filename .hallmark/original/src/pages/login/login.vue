<template>
  <view class="login-page">
    <view class="header-bg">
      <view class="logo-wrap">
        <view class="logo">{{ roleOptions[portalIndex].emoji }}</view>
        <view class="title">职能洞察</view>
        <view class="subtitle">职业数据 · 岗位匹配 · AI 助手</view>
      </view>
    </view>

    <view class="form card">
      <view class="portal-row">
        <view
          v-for="(item, index) in roleOptions"
          :key="item.value"
          class="portal-item"
          :class="{ active: portalIndex === index }"
          @tap="portalIndex = index"
        >
          {{ item.label }}
        </view>
      </view>

      <view class="field">
        <text class="field-label">账号</text>
        <input v-model="username" class="input" placeholder="请输入账号" :maxlength="80" />
      </view>
      <view class="field">
        <text class="field-label">密码</text>
        <input
          v-model="password"
          class="input"
          placeholder="请输入密码"
          password
          :maxlength="200"
          @confirm="handleLogin"
        />
      </view>

      <button class="btn-primary" :disabled="loading" @tap="handleLogin">
        {{ loading ? "登录中…" : "登 录" }}
      </button>

      <view class="tip">账号与 http://www.zndc.art 通用</view>
    </view>

    <view class="health-row">
      <text class="health-label">服务状态</text>
      <text class="health-value" :class="healthClass" @tap="checkHealth">{{ healthText }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { api, type Portal } from "@/api/api";
import { writeSession } from "@/api/request";
import { readSession } from "@/api/request";
import { getPortal, goPortalHome } from "@/utils/portal";

const roleOptions = [
  { label: "个人用户", value: "personal" as Portal, emoji: "🎯" },
  { label: "企业 HR", value: "enterprise" as Portal, emoji: "🏢" },
  { label: "治理管理员", value: "admin" as Portal, emoji: "🛡️" },
];

// 默认选中上次登录的端，避免每次都要重新切换
const savedIndex = roleOptions.findIndex((item) => item.value === getPortal());
const portalIndex = ref(savedIndex >= 0 ? savedIndex : 0);
const username = ref("");
const password = ref("");
const loading = ref(false);
const healthText = ref("点击检测");
const healthClass = ref("");

// 已登录时按上次选择的端直接落地（企业 HR → HR 工作台，其余 → 求职端首页）
if (readSession()) {
  goPortalHome(getPortal());
}

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

async function handleLogin() {
  const name = username.value.trim();
  const pass = password.value;
  if (!name || !pass) {
    uni.showToast({ title: "请输入账号和密码", icon: "none" });
    return;
  }
  loading.value = true;
  try {
    const portal = roleOptions[portalIndex.value].value;
    const result = await api.login(name, pass, portal);
    writeSession(result);
    uni.showToast({ title: `欢迎，${result.user.displayName}`, icon: "success" });
    setTimeout(() => goPortalHome(portal), 400);
  } catch (error) {
    uni.showToast({ title: (error as Error).message || "登录失败", icon: "none" });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 60rpx;
}

.header-bg {
  height: 460rpx;
  background: linear-gradient(180deg, #00bebd 0%, #00a6a5 100%);
  border-bottom-left-radius: 36rpx;
  border-bottom-right-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.logo-wrap {
  text-align: center;
}

.logo {
  width: 152rpx;
  height: 152rpx;
  margin: 0 auto 24rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.24);
  backdrop-filter: blur(8rpx);
}

.title {
  font-size: 48rpx;
  font-weight: 800;
  letter-spacing: 2rpx;
}

.subtitle {
  margin-top: 12rpx;
  font-size: 26rpx;
  opacity: 0.85;
}

.form {
  margin: -100rpx 32rpx 0;
  padding: 36rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.04);
}

.portal-row {
  display: flex;
  background: #f5f6f8;
  border-radius: 14rpx;
  padding: 6rpx;
  margin-bottom: 36rpx;
}

.portal-item {
  flex: 1;
  text-align: center;
  font-size: 27rpx;
  color: #6b6f74;
  padding: 16rpx 0;
  border-radius: 10rpx;
  transition: all 0.2s;
}

.portal-item.active {
  background: #ffffff;
  color: #00bebd;
  font-weight: 700;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.04);
}

.field {
  margin-bottom: 24rpx;
}

.field-label {
  display: block;
  color: #22262e;
  font-size: 26rpx;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.input {
  background: #f5f6f8;
  border-radius: 14rpx;
  height: 90rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
}

.tip {
  text-align: center;
  color: #8a94a6;
  font-size: 24rpx;
  margin-top: 28rpx;
}

.health-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40rpx;
  font-size: 26rpx;
}

.health-label {
  color: #6b6f74;
  margin-right: 12rpx;
}

.health-value {
  color: #8a94a6;
  text-decoration: underline;
}

.health-value.ok {
  color: #2da44e;
}

.health-value.warn {
  color: #f59e0b;
}

.health-value.err {
  color: #e5484d;
}
</style>

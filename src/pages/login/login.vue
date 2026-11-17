<template>
  <view class="login-page">
    <view class="header-bg"><view class="logo-wrap"><view class="logo"><AppIcon name="briefcase" :size="56" /></view><view class="title">职能洞察</view><view class="subtitle">职业数据、岗位匹配与 AI 助手</view></view></view>
    <view class="form">
      <view class="portal-row"><view v-for="(item, index) in roleOptions" :key="item.value" class="portal-item" :class="{ active: portalIndex === index }" role="button" tabindex="0" @tap="portalIndex = index" @keydown.enter.prevent.stop="portalIndex = index" @keydown.space.prevent.stop="portalIndex = index">{{ item.label }}</view></view>
      <view class="field"><text class="field-label">账号</text><input v-model="username" class="input" aria-label="账号" autocomplete="username" placeholder="请输入账号" :maxlength="80" /></view>
      <view class="field"><text class="field-label">密码</text><input v-model="password" class="input" aria-label="密码" autocomplete="current-password" placeholder="请输入密码" password :maxlength="200" @confirm="handleLogin" /></view>
      <button class="btn-primary" :disabled="loading" @tap="handleLogin">{{ loading ? "登录中…" : "登录" }}</button>
      <view class="tip">账号与 http://www.zndc.art 通用</view>
    </view>
    <view class="health-row"><AppIcon name="shield" :size="28" /><text class="health-label">服务状态</text><text class="health-value" :class="healthClass" role="button" tabindex="0" @tap="checkHealth" @keydown.enter.prevent.stop="checkHealth" @keydown.space.prevent.stop="checkHealth">{{ healthText }}</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { api, type Portal } from "@/api/api";
import { writeSession } from "@/api/request";
import { readSession } from "@/api/request";
import { getPortal, goPortalHome } from "@/utils/portal";

const roleOptions = [
  { label: "个人用户", value: "personal" as Portal },
  { label: "企业 HR", value: "enterprise" as Portal },
  { label: "治理管理员", value: "admin" as Portal },
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */


.login-page { min-height: 100vh; background: var(--color-paper); padding: 96rpx 48rpx 48rpx; }.header-bg { padding: 24rpx 0 48rpx; }.logo-wrap { text-align: left; }.logo { display: flex; align-items: center; justify-content: flex-start; color: var(--color-primary); margin-bottom: 24rpx; }.title { font-size: 52rpx; font-weight: 600; color: var(--color-ink); }.subtitle { font-size: 26rpx; color: var(--color-secondary); margin-top: 12rpx; }.form { padding-top: 16rpx; }.portal-row { display: flex; gap: 32rpx; border-bottom: 1px solid var(--color-rule); margin-bottom: 40rpx; }.portal-item { position: relative; color: var(--color-secondary); font-size: 27rpx; padding: 20rpx 0; white-space: nowrap; }.portal-item.active { color: var(--color-primary); }.portal-item.active::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 4rpx; border-radius: 2rpx; background: var(--color-primary); }.field { margin-bottom: 32rpx; }.field-label { display: block; color: var(--color-ink); font-size: 26rpx; margin-bottom: 16rpx; }.input { background: var(--color-surface); color: var(--color-ink); border-radius: 8rpx; height: 92rpx; padding: 0 24rpx; font-size: 30rpx; }.btn-primary { margin-top: 48rpx; }.tip { color: var(--color-muted); font-size: 23rpx; margin-top: 24rpx; text-align: center; }.health-row { display: flex; align-items: center; justify-content: center; gap: 12rpx; margin-top: 56rpx; font-size: 24rpx; color: var(--color-muted); }.health-value { color: var(--color-primary); padding: 12rpx 0; }.health-value.err { color: var(--color-danger); }.health-value.warn { color: var(--color-warning); }

.login-page { padding: 0 40rpx 40rpx; background: var(--color-paper); }
.header-bg { margin: 0 -40rpx; padding: 72rpx 48rpx 52rpx; background: var(--color-brand-wash); border-bottom: 1px solid var(--color-primary-soft); }
.logo-wrap { display: grid; grid-template-columns: 88rpx minmax(0, 1fr); column-gap: 24rpx; text-align: left; }
.logo { grid-row: 1 / 3; width: 88rpx; height: 88rpx; margin: 0; border-radius: 24rpx; background: var(--color-primary); color: var(--color-paper); display: flex; align-items: center; justify-content: center; }
.title { align-self: end; margin: 0; font-size: 44rpx; font-weight: 600; color: var(--color-ink); min-width: 0; overflow-wrap: break-word; }
.subtitle { margin-top: 8rpx; font-size: 23rpx; color: var(--color-secondary); }
.form { padding: 40rpx 0 0; margin: 0; border-radius: 0; background: var(--color-paper); }
.portal-row { display: flex; align-items: center; gap: 8rpx; padding: 8rpx; margin-bottom: 40rpx; background: var(--color-surface); border-radius: 16rpx; }
.portal-item { display: flex; align-items: center; justify-content: center; flex: 1; min-width: 0; min-height: max(88rpx, 44px); padding: 8rpx 4rpx; border: 0; border-radius: 12rpx; background: var(--color-transparent); color: var(--color-secondary); font-size: 25rpx; white-space: nowrap; }
.portal-item.active { color: var(--color-primary); background: var(--color-paper); font-weight: 600; box-shadow: var(--shadow-float); }
.field { margin-bottom: 32rpx; }
.field-label { display: block; margin-bottom: 14rpx; font-size: 27rpx; font-weight: 500; color: var(--color-ink); }
.input { display: flex; align-items: center; width: 100%; height: max(96rpx, 44px); padding: 0 24rpx; background: var(--color-surface); color: var(--color-ink); border: 1px solid var(--color-field-border); border-radius: 12rpx; font-size: 28rpx; }
.btn-primary { margin-top: 40rpx; min-height: 96rpx; border-radius: 12rpx; font-size: 30rpx; font-weight: 600; }
.tip { margin-top: 24rpx; font-size: 23rpx; line-height: 1.6; color: var(--color-muted); text-align: center; }
.health-row { display: flex; align-items: center; justify-content: center; gap: 12rpx; margin-top: 56rpx; padding-top: 24rpx; border-top: 1px solid var(--color-rule); color: var(--color-muted); font-size: 24rpx; }
.health-value { display: inline-flex; align-items: center; min-height: 88rpx; padding: 0 8rpx; color: var(--color-primary); }
@media (max-width: 350px) { .login-page { padding-inline: 28rpx; }.header-bg { margin-inline: -28rpx; padding-inline: 36rpx; }.subtitle { font-size: 22rpx; }.portal-item { font-size: 24rpx; } }
</style>

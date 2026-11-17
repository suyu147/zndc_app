<template>

  <view class="page">
    <view class="header">
      <view class="avatar"><AppIcon name="user" :size="56" /></view>
      <view class="user-name">{{ user?.displayName || "未登录" }}</view>
      <view class="user-role">{{ roleName }}</view>
    </view>

    <view class="card menu-card">
      <view class="cell" @tap="goFavorites" role="button" tabindex="0" @keydown.enter.prevent.stop="goFavorites" @keydown.space.prevent.stop="goFavorites">
        <view class="cell-left">
          <view class="cell-icon icon-fav"><AppIcon name="star" :size="38" /></view>
          <text>我的收藏</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">收藏的岗位</text>
          <AppIcon class="arrow" name="chevron-right" :size="30" />
        </view>
      </view>
      <view class="cell" @tap="checkHealth" role="button" tabindex="0" @keydown.enter.prevent.stop="checkHealth" @keydown.space.prevent.stop="checkHealth">
        <view class="cell-left">
          <view class="cell-icon icon-status"><AppIcon name="shield" :size="38" /></view>
          <text>服务状态</text>
        </view>
        <view class="cell-right">
          <text :class="healthClass">{{ healthText }}</text>
          <AppIcon class="arrow" name="chevron-right" :size="30" />
        </view>
      </view>
      <view class="cell">
        <view class="cell-left">
          <view class="cell-icon icon-server"><AppIcon name="layers" :size="38" /></view>
          <text>服务器</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">www.zndc.art</text>
        </view>
      </view>
      <view class="cell">
        <view class="cell-left">
          <view class="cell-icon icon-version"><AppIcon name="info" :size="38" /></view>
          <text>版本</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">v1.1.0</text>
        </view>
      </view>
    </view>

    <view class="card menu-card">
      <view class="cell" @tap="goHrPortal" role="button" tabindex="0" @keydown.enter.prevent.stop="goHrPortal" @keydown.space.prevent.stop="goHrPortal">
        <view class="cell-left">
          <view class="cell-icon icon-hr"><AppIcon name="building" :size="38" /></view>
          <text>切换到 HR 端</text>
        </view>
        <view class="cell-right">
          <text class="cell-value">招聘工作台</text>
          <AppIcon class="arrow" name="chevron-right" :size="30" />
        </view>
      </view>
      <view class="cell" @tap="relogin" role="button" tabindex="0" @keydown.enter.prevent.stop="relogin" @keydown.space.prevent.stop="relogin">
        <view class="cell-left">
          <view class="cell-icon icon-switch"><AppIcon name="refresh" :size="38" /></view>
          <text>切换账号</text>
        </view>
        <AppIcon class="arrow" name="chevron-right" :size="30" />
      </view>
      <view class="cell logout" @tap="logout" role="button" tabindex="0" @keydown.enter.prevent.stop="logout" @keydown.space.prevent.stop="logout">
        <view class="cell-left">
          <view class="cell-icon icon-logout"><AppIcon name="logout" :size="38" /></view>
          <text>退出登录</text>
        </view>
        <AppIcon class="arrow" name="chevron-right" :size="30" />
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */


.page { padding-bottom: 40rpx; }.header { display: grid; grid-template-columns: 112rpx minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 24rpx; padding: 48rpx 32rpx; background: var(--color-paper); }.avatar { grid-row: 1 / 3; display: flex; align-items: center; justify-content: center; background: var(--color-primary-soft); color: var(--color-primary); width: 112rpx; height: 112rpx; border-radius: 56rpx; }.user-name { font-size: 40rpx; font-weight: 600; align-self: end; color: var(--color-ink); }.user-role { font-size: 25rpx; color: var(--color-secondary); margin-top: 8rpx; }.menu-card { margin-top: 16rpx; padding: 0 32rpx; }.cell-left, .cell-right { display: flex; align-items: center; gap: 16rpx; min-width: 0; }.cell-icon { display: flex; align-items: center; justify-content: center; color: var(--color-secondary); width: 40rpx; height: 48rpx; }.cell-value { color: var(--color-muted); font-size: 24rpx; }.arrow { color: var(--color-muted); }.cell.logout { color: var(--color-danger); }.cell .ok { color: var(--color-primary); }.cell .err { color: var(--color-danger); }.cell .warn { color: var(--color-warning); }

.page { padding-bottom: 40rpx; }
.header { position: relative; display: grid; grid-template-columns: 120rpx minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 28rpx; padding: 52rpx 36rpx 48rpx; background: var(--color-brand-wash); border-bottom: 1px solid var(--color-primary-soft); }
.avatar { grid-row: 1 / 3; width: 120rpx; height: 120rpx; border-radius: 36rpx; background: var(--color-paper); color: var(--color-primary); border: 1px solid var(--color-primary-soft); }
.user-name { font-size: 42rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }
.user-role { display: flex; align-items: center; gap: 12rpx; margin-top: 10rpx; font-size: 25rpx; color: var(--color-primary); }
.menu-card { margin: 20rpx 24rpx 0; padding: 4rpx 28rpx; border-radius: var(--radius-card); background: var(--color-paper); }
.cell { min-height: 116rpx; padding: 20rpx 0; gap: 12rpx; }
.cell-left { flex: 1; gap: 20rpx; min-width: 0; font-size: 28rpx; }
.cell-right { gap: 8rpx; flex-shrink: 0; }
.cell-icon { width: 48rpx; height: 52rpx; color: var(--color-secondary); }
.icon-fav { color: var(--color-warm-ink); }
.icon-status, .icon-hr { color: var(--color-primary); }
.icon-server, .icon-switch { color: var(--color-cool-ink); }
.icon-logout { color: var(--color-danger); }
.cell-value { font-size: 23rpx; color: var(--color-muted); }
.arrow { color: var(--color-muted); opacity: .65; }
.cell.logout { color: var(--color-danger); }
@media (max-width: 350px) { .header { padding-inline: 28rpx; column-gap: 20rpx; }.menu-card { padding-inline: 24rpx; }.cell-left { gap: 12rpx; font-size: 27rpx; }.cell-value { font-size: 22rpx; } }
</style>

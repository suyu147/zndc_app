<template>
  <view class="assistant-page">
    <!-- 顶部模式与上下文 -->
    <view class="top-bar">
      <view class="mode-row">
        <view
          v-for="mode in modeOptions"
          :key="mode.value"
          class="mode-item"
          :class="{ active: agentMode === mode.value }"
          @tap="agentMode = mode.value"
        >{{ mode.label }}</view>
      </view>
      <view v-if="contextChips.length" class="ctx-row">
        <view v-for="chip in contextChips" :key="chip.key" class="ctx-chip" @tap="removeCtx(chip.key)">
          {{ chip.text }} ✕
        </view>
      </view>
      <view class="tool-row">
        <view class="tool-btn" @tap="newChat">＋ 新对话</view>
        <view class="tool-btn" @tap="openHistory">历史会话</view>
      </view>
    </view>

    <!-- 消息区 -->
    <scroll-view
      class="chat-scroll"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
    >
      <view v-if="messages.length === 0" class="welcome">
        <view class="welcome-icon brand">职</view>
        <view class="welcome-title">{{ currentModeLabel }} · 职能洞察智能体</view>
        <view class="welcome-text">
          我可以结合岗位数据库、趋势与你的诊断报告，帮你做职业规划与能力分析。
        </view>
        <view class="quick-row">
          <view v-for="q in quickQuestions" :key="q" class="quick-chip" @tap="askQuick(q)">{{ q }}</view>
        </view>
      </view>

      <view v-for="(msg, index) in messages" :key="msg.id" class="msg-row" :class="msg.role">
        <view class="bubble" :class="msg.role">
          <view v-if="msg.pending && !msg.content" class="thinking">思考中<text class="dot">…</text></view>
          <text v-else class="msg-text">{{ msg.content || (msg.error ? "（回答中断）" : "") }}</text>
          <view v-if="msg.evidence && msg.evidence.length" class="evidence">
            <view v-for="(ev, ei) in msg.evidence.slice(0, 4)" :key="ei" class="ev-item" @tap="openUrl(ev.url)">
              <view class="ev-source" v-if="ev.sourceRecord || ev.period">
                {{ ev.sourceRecord || "来源" }}<text v-if="ev.period"> · {{ ev.period }}</text>
              </view>
              <view class="ev-snippet" v-if="ev.snippet">{{ ev.snippet }}</view>
              <view class="ev-open" v-if="isHttp(ev.url)">打开链接 ↗</view>
            </view>
          </view>
        </view>
        <view class="avatar" :class="msg.role">{{ msg.role === "assistant" ? "职" : "我" }}</view>
      </view>
      <view id="chat-bottom" class="chat-bottom"></view>
    </scroll-view>

    <!-- 输入区 -->
    <view class="input-bar">
      <textarea
        v-model="draft"
        class="chat-input"
        placeholder="输入你的问题，回车发送"
        :maxlength="2000"
        :disabled="streaming"
        confirm-type="send"
        @confirm="send"
      />
      <view class="send-btn" :class="{ disabled: streaming || !draft.trim() }" @tap="send">
        {{ streaming ? "…" : "发送" }}
      </view>
    </view>

    <!-- 历史会话抽屉 -->
    <view v-if="showHistory" class="mask" @tap="closeHistory">
      <view class="drawer" @tap.stop>
        <view class="drawer-head">
          <text class="drawer-title">历史会话（{{ historyList.length }}）</text>
          <text class="drawer-close" @tap="closeHistory">关闭</text>
        </view>
        <scroll-view scroll-y class="drawer-body">
          <view v-if="historyLoading" class="loading-text">加载中…</view>
          <view v-for="item in historyList" :key="item.id" class="hist-row">
            <view class="hist-main" @tap="loadHistory(item.id)">
              <view class="hist-title">{{ item.title || "未命名对话" }}</view>
              <view class="hist-sub">
                {{ item.messageCount }} 条
                <text v-if="item.updatedAt"> · {{ String(item.updatedAt).slice(0, 16).replace("T", " ") }}</text>
              </view>
            </view>
            <view class="hist-del" @tap="deleteHistory(item.id)">删除</view>
          </view>
          <view v-if="!historyLoading && historyList.length === 0" class="empty-text">还没有历史会话</view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { api } from "@/api/api";
import { streamAgentChat } from "@/api/agentChat";
import { requireLogin } from "@/api/request";
import type { AgentEvidenceItem, AgentHistoryMessage, AgentMode } from "@/api/types";
import { takePendingCtx } from "@/utils/tabCtx";

interface ChatMsg {
  id: number;
  role: "user" | "assistant";
  content: string;
  evidence?: AgentEvidenceItem[];
  pending?: boolean;
  error?: boolean;
}

const modeOptions = [
  { value: "career_planning" as AgentMode, label: "职业规划" },
  { value: "ability_analysis" as AgentMode, label: "能力分析" },
];

const quickQuestions = ["数据分析师近年有什么趋势？", "帮我规划进入大模型的路径", "简历里应该突出哪些技能？"];

const agentMode = ref<AgentMode>("career_planning");
const roleCtx = ref<{ roleId: string; roleName: string } | null>(null);
const reportCtx = ref<{ reportId: string } | null>(null);

const messages = ref<ChatMsg[]>([]);
const draft = ref("");
const streaming = ref(false);
const sessionId = ref("");
const scrollTop = ref(0);
let msgSeq = 1;

const showHistory = ref(false);
const historyList = ref<Array<{ id: string; title: string; messageCount: number; updatedAt?: string }>>([]);
const historyLoading = ref(false);

const currentModeLabel = computed(() =>
  agentMode.value === "ability_analysis" ? "能力分析" : "职业规划"
);

const contextChips = computed(() => {
  const chips: Array<{ key: string; text: string }> = [];
  if (reportCtx.value) chips.push({ key: "report", text: "📊 已关联诊断报告" });
  if (roleCtx.value) chips.push({ key: "role", text: `🎯 ${roleCtx.value.roleName}` });
  return chips;
});

onShow(() => {
  if (requireLogin()) return;
  const ctx = takePendingCtx("assistant");
  if (ctx && (ctx.reportId || ctx.roleId || ctx.mode)) {
    applyPendingCtx(ctx);
  }
});

function applyPendingCtx(ctx: { mode?: AgentMode; reportId?: string; roleId?: string; roleName?: string }) {
  messages.value = [];
  sessionId.value = "";
  if (ctx.mode === "ability_analysis" || ctx.mode === "career_planning") {
    agentMode.value = ctx.mode;
  }
  reportCtx.value = ctx.reportId ? { reportId: ctx.reportId } : null;
  roleCtx.value = ctx.roleId ? { roleId: ctx.roleId, roleName: ctx.roleName || "该岗位" } : null;
  scrollToBottom();
}

function scrollToBottom() {
  scrollTop.value = 0;
  setTimeout(() => {
    scrollTop.value = 999999;
  }, 30);
}

function pushMessage(role: "user" | "assistant", content: string, extra?: Partial<ChatMsg>): ChatMsg {
  const msg: ChatMsg = { id: msgSeq++, role, content, ...extra };
  messages.value.push(msg);
  scrollToBottom();
  return msg;
}

function removeCtx(key: string) {
  if (key === "report") reportCtx.value = null;
  if (key === "role") roleCtx.value = null;
}

function newChat() {
  if (streaming.value) return;
  if (messages.value.length === 0 && !sessionId.value) return;
  uni.showModal({
    title: "新建对话",
    content: "将清空当前对话记录（服务端历史仍保留），确定开始新对话？",
    success: (res) => {
      if (!res.confirm) return;
      messages.value = [];
      sessionId.value = "";
    },
  });
}

async function send() {
  const text = draft.value.trim();
  if (!text || streaming.value) return;
  draft.value = "";
  pushMessage("user", text);
  await sendMessage(text);
}

function askQuick(q: string) {
  if (streaming.value) return;
  pushMessage("user", q);
  sendMessage(q);
}

async function sendMessage(text: string) {
  streaming.value = true;
  const assistantMsg = pushMessage("assistant", "", { pending: true });
  const payload = {
    agentMode: agentMode.value,
    message: text,
    sessionId: sessionId.value || undefined,
    ...(reportCtx.value ? { reportId: reportCtx.value.reportId } : {}),
    ...(roleCtx.value ? { roleId: roleCtx.value.roleId, roleName: roleCtx.value.roleName } : {}),
  };
  try {
    const done = await streamAgentChat(payload, {
      onToken: (delta) => {
        assistantMsg.content += delta;
        scrollToBottom();
      },
      onEvidence: (items) => {
        if (items?.length) assistantMsg.evidence = [...(assistantMsg.evidence || []), ...items];
      },
      onDone: (info) => {
        assistantMsg.pending = false;
        if (info.sessionId) sessionId.value = info.sessionId;
      },
    });
    if (!assistantMsg.content) {
      assistantMsg.content = done.providerReason === "provider_unavailable" ? "（智能体服务暂不可用，请稍后再试）" : "（未获得回答）";
    }
    assistantMsg.pending = false;
  } catch (error) {
    assistantMsg.pending = false;
    assistantMsg.error = true;
    assistantMsg.content = (error as Error).message || "回答失败";
    uni.showToast({ title: (error as Error).message || "回答失败", icon: "none" });
  } finally {
    streaming.value = false;
    scrollToBottom();
  }
}

function openHistory() {
  showHistory.value = true;
  loadHistoryList();
}

function closeHistory() {
  showHistory.value = false;
}

async function loadHistoryList() {
  historyLoading.value = true;
  try {
    const result = await api.getAgentSessions(30);
    historyList.value = result.items;
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
  } finally {
    historyLoading.value = false;
  }
}

async function loadHistory(id: string) {
  if (streaming.value) return;
  try {
    const detail = await api.getAgentSession(id);
    sessionId.value = detail.id;
    roleCtx.value = null;
    reportCtx.value = null;
    messages.value = (detail.messages || []).map((m: AgentHistoryMessage) => ({
      id: msgSeq++,
      role: m.role === "user" ? "user" : "assistant",
      content: m.content || "",
      evidence: m.evidence || [],
    }));
    closeHistory();
    scrollToBottom();
  } catch (error) {
    uni.showToast({ title: (error as Error).message, icon: "none" });
  }
}

function deleteHistory(id: string) {
  uni.showModal({
    title: "删除会话",
    content: "删除后无法恢复，确定删除该会话？",
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await api.deleteAgentSession(id);
        historyList.value = historyList.value.filter((item) => item.id !== id);
        if (sessionId.value === id) {
          sessionId.value = "";
          messages.value = [];
        }
        uni.showToast({ title: "已删除", icon: "none" });
      } catch (error) {
        uni.showToast({ title: (error as Error).message, icon: "none" });
      }
    },
  });
}

function isHttp(url?: string): boolean {
  return /^https?:\/\//i.test(url || "");
}

function openUrl(url?: string) {
  if (!isHttp(url)) return;
  // #ifdef H5
  window.open(url as string, "_blank");
  // #endif
  // #ifndef H5
  uni.navigateTo({ url: `/pages/webview/webview?url=${encodeURIComponent(url as string)}` });
  // #endif
}
</script>

<style scoped>
.assistant-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--window-bottom, 0px));
  background: #f5f6fa;
}

.top-bar {
  background: #ffffff;
  padding: 16rpx 24rpx 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(38, 48, 62, 0.04);
}

.mode-row {
  display: flex;
  background: #f2f4f9;
  border-radius: 14rpx;
  padding: 6rpx;
}

.mode-item {
  flex: 1;
  text-align: center;
  font-size: 27rpx;
  color: #6b7688;
  padding: 14rpx 0;
  border-radius: 10rpx;
}

.mode-item.active {
  background: #00bebd;
  color: #ffffff;
  font-weight: 600;
}

.ctx-row {
  display: flex;
  flex-wrap: wrap;
  margin-top: 12rpx;
}

.ctx-chip {
  background: #e5f7f7;
  color: #00bebd;
  font-size: 23rpx;
  padding: 8rpx 18rpx;
  border-radius: 24rpx;
  margin-right: 12rpx;
  margin-bottom: 6rpx;
}

.tool-row {
  display: flex;
  margin-top: 12rpx;
}

.tool-btn {
  color: #00bebd;
  font-size: 25rpx;
  margin-right: 32rpx;
  padding: 6rpx 0;
}

.chat-scroll {
  flex: 1;
  overflow: hidden;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.welcome {
  text-align: center;
  padding: 70rpx 30rpx 30rpx;
}

.welcome-icon {
  font-size: 90rpx;
}

.welcome-icon.brand {
  width: 140rpx;
  height: 140rpx;
  line-height: 140rpx;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #00bebd, #00a6a5);
  color: #ffffff;
  font-size: 64rpx;
  font-weight: 700;
}

.welcome-title {
  font-size: 32rpx;
  font-weight: 700;
  margin-top: 16rpx;
}

.welcome-text {
  margin-top: 14rpx;
  color: #8a94a6;
  font-size: 26rpx;
  line-height: 1.6;
}

.quick-row {
  margin-top: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-chip {
  background: #ffffff;
  border: 1rpx solid #e3e7f0;
  border-radius: 30rpx;
  padding: 14rpx 30rpx;
  margin-top: 16rpx;
  font-size: 25rpx;
  color: #26303e;
  max-width: 90%;
}

.msg-row {
  display: flex;
  margin: 20rpx 0;
}

.msg-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  flex-shrink: 0;
}

.avatar.assistant {
  background: linear-gradient(135deg, #00bebd, #00a6a5);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
}

.avatar.user {
  background: #e5f7f7;
  color: #00bebd;
  font-weight: 700;
}

.bubble {
  max-width: 76%;
  margin: 0 16rpx;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  line-height: 1.6;
  word-break: break-all;
}

.bubble.assistant {
  background: #ffffff;
  border-top-left-radius: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(38, 48, 62, 0.05);
}

.bubble.user {
  background: #00bebd;
  color: #ffffff;
  border-top-right-radius: 4rpx;
}

.thinking {
  color: #8a94a6;
}

.dot {
  animation: blink 1.2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
}

.evidence {
  margin-top: 16rpx;
  border-top: 1rpx dashed #e3e7f0;
  padding-top: 12rpx;
}

.ev-item {
  background: #f7fbfb;
  border-radius: 12rpx;
  padding: 12rpx 16rpx;
  margin-top: 10rpx;
}

.ev-source {
  font-size: 22rpx;
  color: #00bebd;
  font-weight: 600;
}

.ev-snippet {
  font-size: 22rpx;
  color: #6b7688;
  margin-top: 6rpx;
  line-height: 1.5;
}

.ev-open {
  font-size: 22rpx;
  color: #0ea5e9;
  margin-top: 6rpx;
}

.chat-bottom {
  height: 20rpx;
}

.input-bar {
  display: flex;
  align-items: flex-end;
  background: #ffffff;
  padding: 14rpx 20rpx;
  padding-bottom: calc(14rpx + env(safe-area-inset-bottom));
}

.chat-input {
  flex: 1;
  min-height: 76rpx;
  max-height: 200rpx;
  background: #f2f4f9;
  border-radius: 18rpx;
  padding: 14rpx 22rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.send-btn {
  margin-left: 16rpx;
  background: #00bebd;
  color: #fff;
  font-size: 28rpx;
  border-radius: 16rpx;
  padding: 16rpx 28rpx;
}

.send-btn.disabled {
  opacity: 0.5;
}

.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
}

.drawer {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 78%;
  background: #ffffff;
  border-top-left-radius: 24rpx;
  border-bottom-left-radius: 24rpx;
  display: flex;
  flex-direction: column;
}

.drawer-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 28rpx 16rpx;
}

.drawer-title {
  font-size: 32rpx;
  font-weight: 700;
}

.drawer-close {
  color: #8a94a6;
  font-size: 26rpx;
}

.drawer-body {
  flex: 1;
  padding: 0 28rpx;
  overflow: hidden;
}

.hist-row {
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #f0f2f7;
  padding: 20rpx 0;
}

.hist-main {
  flex: 1;
}

.hist-title {
  font-size: 28rpx;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hist-sub {
  margin-top: 6rpx;
  color: #8a94a6;
  font-size: 22rpx;
}

.hist-del {
  color: #e5484d;
  font-size: 25rpx;
  padding: 10rpx 16rpx;
}
</style>

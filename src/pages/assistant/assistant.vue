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
         role="button" tabindex="0" @keydown.enter.prevent.stop="agentMode = mode.value" @keydown.space.prevent.stop="agentMode = mode.value">{{ mode.label }}</view>
      </view>
      <view v-if="contextChips.length" class="ctx-row">
        <view v-for="chip in contextChips" :key="chip.key" class="ctx-chip" @tap="removeCtx(chip.key)" role="button" tabindex="0" @keydown.enter.prevent.stop="removeCtx(chip.key)" @keydown.space.prevent.stop="removeCtx(chip.key)">
          <AppIcon :name="chip.key === 'report' ? 'chart' : 'briefcase'" size="16" /><text>{{ chip.text }}</text><AppIcon name="close" size="14" />
        </view>
      </view>
      <view class="tool-row">
        <view class="tool-btn" @tap="newChat" role="button" tabindex="0" @keydown.enter.prevent.stop="newChat" @keydown.space.prevent.stop="newChat"><AppIcon name="plus" size="18" /><text>新对话</text></view>
        <view class="tool-btn" @tap="openHistory" role="button" tabindex="0" @keydown.enter.prevent.stop="openHistory" @keydown.space.prevent.stop="openHistory"><AppIcon name="clock" size="18" /><text>历史会话</text></view>
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
        <view class="welcome-icon"><AppIcon name="message" size="28" /></view>
        <view class="welcome-title">{{ currentModeLabel }}</view>
        <view class="welcome-text">
          我可以结合岗位数据库、趋势与你的诊断报告，帮你做职业规划与能力分析。
        </view>
        <view class="quick-row">
          <view v-for="q in quickQuestions" :key="q" class="quick-chip" @tap="askQuick(q)" role="button" tabindex="0" @keydown.enter.prevent.stop="askQuick(q)" @keydown.space.prevent.stop="askQuick(q)"><text>{{ q }}</text><AppIcon name="chevron-right" size="16" /></view>
        </view>
      </view>

      <view v-for="(msg, index) in messages" :key="msg.id" class="msg-row" :class="msg.role">
        <view class="bubble" :class="msg.role">
          <view v-if="msg.pending && !msg.content" class="thinking">思考中<text class="dot">…</text></view>
          <text v-else class="msg-text">{{ msg.content || (msg.error ? "（回答中断）" : "") }}</text>
          <view v-if="msg.evidence && msg.evidence.length" class="evidence">
            <view v-for="(ev, ei) in msg.evidence.slice(0, 4)" :key="ei" class="ev-item" @tap="openUrl(ev.url)" role="button" tabindex="0" @keydown.enter.prevent.stop="openUrl(ev.url)" @keydown.space.prevent.stop="openUrl(ev.url)">
              <view class="ev-source" v-if="ev.sourceRecord || ev.period">
                {{ ev.sourceRecord || "来源" }}<text v-if="ev.period">　{{ ev.period }}</text>
              </view>
              <view class="ev-snippet" v-if="ev.snippet">{{ ev.snippet }}</view>
              <view class="ev-open" v-if="isHttp(ev.url)">打开链接</view>
            </view>
          </view>
        </view>
        <view class="avatar" :class="msg.role"><AppIcon :name="msg.role === 'assistant' ? 'message' : 'user'" size="20" /></view>
      </view>
      <view id="chat-bottom" class="chat-bottom"></view>
    </scroll-view>

    <!-- 输入区 -->
    <view class="input-bar">
      <textarea
        v-model="draft"
        class="chat-input"
        aria-label="输入你的职业问题" placeholder="输入你的职业问题"
        :maxlength="2000"
        :disabled="streaming"
        confirm-type="send"
        @confirm="send"
      />
      <view class="send-btn" :class="{ disabled: streaming || !draft.trim() }" @tap="send" role="button" tabindex="0" @keydown.enter.prevent.stop="send" @keydown.space.prevent.stop="send">
        {{ streaming ? "…" : "发送" }}
      </view>
    </view>

    <!-- 历史会话抽屉 -->
    <view v-if="showHistory" class="mask" @tap="closeHistory" role="button" tabindex="0" @keydown.enter.prevent.stop="closeHistory" @keydown.space.prevent.stop="closeHistory">
      <view class="drawer" @tap.stop>
        <view class="drawer-head">
          <text class="drawer-title">历史会话（{{ historyList.length }}）</text>
          <text class="drawer-close" @tap="closeHistory" role="button" tabindex="0" @keydown.enter.prevent.stop="closeHistory" @keydown.space.prevent.stop="closeHistory">关闭</text>
        </view>
        <scroll-view scroll-y class="drawer-body">
          <view v-if="historyLoading" class="loading-text">加载中…</view>
          <view v-for="item in historyList" :key="item.id" class="hist-row">
            <view class="hist-main" @tap="loadHistory(item.id)" role="button" tabindex="0" @keydown.enter.prevent.stop="loadHistory(item.id)" @keydown.space.prevent.stop="loadHistory(item.id)">
              <view class="hist-title">{{ item.title || "未命名对话" }}</view>
              <view class="hist-sub">
                {{ item.messageCount }} 条
                <text v-if="item.updatedAt">　{{ String(item.updatedAt).slice(0, 16).replace("T", " ") }}</text>
              </view>
            </view>
            <view class="hist-del" @tap="deleteHistory(item.id)" role="button" tabindex="0" @keydown.enter.prevent.stop="deleteHistory(item.id)" @keydown.space.prevent.stop="deleteHistory(item.id)">删除</view>
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
  if (reportCtx.value) chips.push({ key: "report", text: "已关联诊断报告" });
  if (roleCtx.value) chips.push({ key: "role", text: `${roleCtx.value.roleName}` });
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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · theme: project teal · shape: app screen · redesign: full · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V4 · weakest: S; led with real career questions and report context. */
.assistant-page { display:flex; flex-direction:column; height:calc(100dvh - var(--window-top, 0px) - var(--window-bottom, 0px)); min-height:500rpx; background:var(--color-surface); }
.top-bar { background:var(--color-paper); padding: 0 32rpx 20rpx; border-bottom:1rpx solid var(--color-rule); display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap: 16rpx; }
.mode-row { display:flex; gap: 32rpx; }
.mode-item { color:var(--color-secondary); font-size:28rpx; min-height:88rpx; display:flex; align-items:center; border-bottom:4rpx solid transparent; }
.mode-item.active { color:var(--color-ink); font-weight:600; border-bottom-color:var(--color-primary); }
.tool-row { display:flex; gap: 24rpx; }
.tool-btn { display:flex; align-items:center; gap: 8rpx; color:var(--color-secondary); font-size:24rpx; min-height:72rpx; }
.ctx-row { width:100%; order:3; display:flex; flex-wrap:wrap; gap: 12rpx; }
.ctx-chip { display:flex; align-items:center; gap: 8rpx; max-width:100%; background:var(--color-primary-soft); color:var(--color-primary); font-size:24rpx; padding: 12rpx 16rpx; border-radius:6rpx; }
.chat-scroll { flex:1; min-height:0; width:100%; box-sizing:border-box; }
.welcome { padding: 56rpx 40rpx; }
.welcome-icon { color:var(--color-primary); margin-bottom: 24rpx; }
.welcome-title { font-size:40rpx; font-weight:600; color:var(--color-ink); min-width:0; overflow-wrap:break-word; }
.welcome-text { margin-top: 20rpx; font-size:28rpx; color:var(--color-secondary); line-height:1.7; max-width:600rpx; }
.quick-row { margin-top: 40rpx; border-top:1rpx solid var(--color-rule); }
.quick-chip { display:flex; align-items:center; justify-content:space-between; gap: 20rpx; padding: 24rpx 0; min-height:40rpx; border-bottom:1rpx solid var(--color-rule); font-size:27rpx; color:var(--color-ink); }
.msg-row { display:flex; align-items:flex-start; margin: 28rpx 24rpx; gap: 14rpx; }
.msg-row.user { flex-direction:row-reverse; }
.avatar { order:-1; width:56rpx; height:64rpx; flex-shrink:0; display:flex; align-items:center; justify-content:center; color:var(--color-secondary); }
.avatar.assistant { color:var(--color-primary); }
.bubble { max-width:calc(100% - 98rpx); padding: 20rpx 24rpx; border-radius:8rpx; font-size:29rpx; line-height:1.75; overflow-wrap:anywhere; box-sizing:border-box; }
.bubble.assistant { background:var(--color-paper); color:var(--color-ink); }
.bubble.user { background:var(--color-primary-soft); color:var(--color-ink); }
.thinking { color:var(--color-muted); }
.evidence { margin-top: 20rpx; padding-top: 16rpx; border-top:1rpx solid var(--color-rule); }
.ev-item { padding: 12rpx 0; border-bottom:1rpx solid var(--color-rule); }
.ev-item:last-child { border-bottom:0; }
.ev-source { font-size:24rpx; color:var(--color-secondary); }
.ev-snippet { font-size:25rpx; color:var(--color-secondary); margin-top: 8rpx; line-height:1.6; }
.ev-open { color:var(--color-primary); font-size:25rpx; padding-top: 12rpx; }
.chat-bottom { height:24rpx; }
.input-bar { display:flex; align-items:flex-end; gap: 16rpx; background:var(--color-paper); border-top:1rpx solid var(--color-rule); padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom)); }
.chat-input { flex:1; min-width:0; height:88rpx; max-height:200rpx; box-sizing:border-box; padding: 20rpx; background:var(--color-surface); border-radius:8rpx; font-size:28rpx; line-height:1.5; }
.send-btn { flex-shrink:0; background:var(--color-primary); color:var(--color-paper); padding: 0 24rpx; min-height:88rpx; display:flex; align-items:center; border-radius:8rpx; font-size:28rpx; }
.send-btn.disabled { opacity:.5; }
.mask { position:fixed; inset:0; background:var(--color-mask); z-index:100; }
.drawer { position:absolute; right:0; top:0; bottom:0; width:88%; max-width:640rpx; background:var(--color-paper); display:flex; flex-direction:column; }
.drawer-head { display:flex; justify-content:space-between; align-items:center; padding: 28rpx 24rpx; border-bottom:1rpx solid var(--color-rule); }
.drawer-title { font-size:30rpx; font-weight:600; }
.drawer-close { color:var(--color-secondary); font-size:26rpx; padding: 12rpx; }
.drawer-body { flex:1; min-height:0; box-sizing:border-box; padding: 0 24rpx; }
.hist-row { display:flex; align-items:center; padding: 24rpx 0; border-bottom:1rpx solid var(--color-rule); gap: 16rpx; }
.hist-main { flex:1; min-width:0; }
.hist-title { font-size:28rpx; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.hist-sub { color:var(--color-muted); font-size:24rpx; margin-top: 12rpx; }
.hist-del { color:var(--color-secondary); font-size:26rpx; padding: 16rpx 0 16rpx 16rpx; }
[role=button]:focus-visible, [tabindex]:focus-visible, button:focus-visible, textarea:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }
@media (max-width:360px) { .top-bar { gap: 0; } .tool-row { gap: 16rpx; } .tool-btn { font-size:22rpx; } }
@media (prefers-reduced-motion:reduce) { * { animation:none !important; transition:none !important; scroll-behavior:auto !important; } }
</style>

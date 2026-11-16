<template>
  <view class="chat-page">
    <scroll-view scroll-y class="chat-scroll" :scroll-top="scrollTop" :scroll-with-animation="true">
      <view class="chat-notice">
        <text class="chat-notice-text">沟通已加密，请勿在聊天中透露敏感信息</text>
      </view>

      <view
        v-for="msg in thread?.messages || []"
        :key="msg.id"
        class="msg-row"
        :class="msg.from === 'me' ? 'msg-row--me' : ''"
      >
        <hr-avatar v-if="msg.from !== 'me'" :name="name" :size="76" :color="'linear-gradient(135deg, #00BEBD 0%, #00A6A5 100%)'" />
        <view class="bubble" :class="msg.from === 'me' ? 'bubble--me' : ''">
          <text class="bubble-text">{{ msg.content }}</text>
        </view>
        <hr-avatar
          v-if="msg.from === 'me'"
          name="我"
          :size="76"
          color="linear-gradient(135deg, #0E6E75 0%, #00A6A5 100%)"
        />
      </view>

      <view class="chat-anchor"></view>
    </scroll-view>

    <!-- 快捷话术 -->
    <scroll-view scroll-x class="quick-scroll" :show-scrollbar="false">
      <view class="quick-track">
        <text v-for="text in QUICK_REPLIES" :key="text" class="quick-chip" @tap="draft = text">{{ text }}</text>
      </view>
    </scroll-view>

    <!-- 输入栏 -->
    <view class="input-bar">
      <input
        v-model="draft"
        class="chat-input"
        placeholder="输入消息…"
        :maxlength="300"
        confirm-type="send"
        @confirm="send"
      />
      <text class="send-btn" :class="{ 'send-btn--disabled': !draft.trim() }" @tap="send">发送</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import HrAvatar from "@/components/hr-avatar.vue";
import { getMessageThread, sendMessage } from "@/hr/api";
import type { HrMessage } from "@/hr/types";

const QUICK_REPLIES = [
  "您好，方便聊聊这个岗位吗？",
  "方便约个时间面试吗？",
  "您的简历已通过初筛",
  "Offer 已发送，请查收",
  "期待您的回复",
];

const candidateId = ref("");
const name = ref("");
const thread = ref<HrMessage | null>(null);
const draft = ref("");
const scrollTop = ref(0);

onLoad((query) => {
  candidateId.value = (query?.candidateId as string) || "";
  name.value = (query?.name as string) || "候选人";
  if (name.value) uni.setNavigationBarTitle({ title: name.value });
});

onShow(() => {
  if (candidateId.value) load();
});

async function load() {
  thread.value = (await getMessageThread(candidateId.value)) || null;
  scrollToBottom();
}

/** 每次递增 scrollTop，scroll-view 会自动吸附到内容底部 */
function scrollToBottom() {
  nextTick(() => {
    scrollTop.value += 10000;
  });
}

async function send() {
  const content = draft.value.trim();
  if (!content) return;
  await sendMessage(candidateId.value, content);
  draft.value = "";
  await load();
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7f8;
}

.chat-scroll {
  flex: 1;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
}

.chat-notice {
  text-align: center;
  margin-bottom: 24rpx;
}

.chat-notice-text {
  display: inline-block;
  font-size: 20rpx;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20rpx;
  padding: 8rpx 20rpx;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

.msg-row--me {
  flex-direction: row;
  justify-content: flex-end;
}

.bubble {
  max-width: 500rpx;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  background: #ffffff;
  margin-left: 18rpx;
  position: relative;
  box-shadow: 0 2rpx 8rpx rgba(15, 40, 45, 0.04);
}

.bubble--me {
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
  margin-left: 0;
  margin-right: 18rpx;
}

.bubble-text {
  font-size: 26rpx;
  line-height: 1.6;
  color: #1a1d24;
}

.bubble--me .bubble-text {
  color: #ffffff;
}

.chat-anchor {
  height: 2rpx;
}

/* ---------- 快捷话术 ---------- */
.quick-scroll {
  width: 100%;
  white-space: nowrap;
  background: #ffffff;
  border-top: 1rpx solid #eef1f5;
  padding: 16rpx 0;
}

.quick-track {
  display: inline-flex;
  padding: 0 24rpx;
}

.quick-chip {
  display: inline-block;
  font-size: 23rpx;
  color: #4b5563;
  background: #f1f4f7;
  border-radius: 26rpx;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
}

/* ---------- 输入栏 ---------- */
.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #ffffff;
  border-top: 1rpx solid #eef1f5;
}

.chat-input {
  flex: 1;
  height: 76rpx;
  background: #f5f7f8;
  border-radius: 38rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  color: #1a1d24;
}

.send-btn {
  flex-shrink: 0;
  margin-left: 18rpx;
  padding: 0 32rpx;
  height: 76rpx;
  line-height: 76rpx;
  border-radius: 38rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #00bebd 0%, #00a6a5 100%);
}

.send-btn--disabled {
  opacity: 0.45;
}
</style>

<template>
  <view class="hr-page hr-page--plain">
    <view v-if="!list.length" class="hr-empty">暂无沟通记录</view>

    <view v-for="item in list" :key="item.id" class="msg-item" @tap="openChat(item)">
      <view class="msg-avatar-wrap">
        <hr-avatar :name="item.candidateName" :size="96" />
        <view v-if="item.online" class="msg-online"></view>
        <view v-if="item.unread" class="msg-unread">{{ item.unread }}</view>
      </view>

      <view class="msg-body">
        <view class="msg-top">
          <text class="msg-name">{{ item.candidateName }}</text>
          <text class="msg-time">{{ item.time }}</text>
        </view>
        <text class="msg-pos">{{ item.positionTitle }}</text>
        <text class="msg-last">{{ item.lastMessage }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import HrAvatar from "@/components/hr-avatar.vue";
import { getMessages } from "@/hr/api";
import type { HrMessage } from "@/hr/types";

const list = ref<HrMessage[]>([]);

onShow(() => {
  load();
});

async function load() {
  list.value = await getMessages();
}

function openChat(item: HrMessage) {
  uni.navigateTo({
    url: `/pages-hr/chat/chat?candidateId=${encodeURIComponent(item.candidateId)}&name=${encodeURIComponent(item.candidateName)}`,
  });
}
</script>

<style scoped>
.msg-item {
  display: flex;
  align-items: center;
  padding: 26rpx 24rpx;
  background: #ffffff;
  border-bottom: 1rpx solid #f1f4f7;
}

.msg-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.msg-online {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: #2da44e;
  border: 3rpx solid #ffffff;
}

.msg-unread {
  position: absolute;
  top: -8rpx;
  right: -10rpx;
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 9rpx;
  box-sizing: border-box;
  border-radius: 17rpx;
  background: #f5484d;
  color: #ffffff;
  font-size: 20rpx;
  line-height: 34rpx;
  text-align: center;
  font-weight: 600;
  border: 2rpx solid #ffffff;
}

.msg-body {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.msg-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.msg-name {
  font-size: 29rpx;
  font-weight: 700;
  color: #1a1d24;
}

.msg-time {
  font-size: 21rpx;
  color: #c2c9d6;
  flex-shrink: 0;
  padding-left: 16rpx;
}

.msg-pos {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #00a6a5;
}

.msg-last {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

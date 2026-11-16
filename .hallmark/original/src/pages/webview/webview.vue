<template>
  <view class="page">
    <web-view v-if="url" :src="url"></web-view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";

const url = ref("");

onLoad((query) => {
  const raw = query?.url ? decodeURIComponent(query.url as string) : "";
  if (/^https?:\/\//i.test(raw)) {
    url.value = raw;
  } else {
    uni.showToast({ title: "链接地址无效", icon: "none" });
    setTimeout(() => uni.navigateBack(), 600);
  }
});
</script>

<style scoped>
.page {
  min-height: 100vh;
}
</style>

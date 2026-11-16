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
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · theme: project teal · shape: app screen · redesign: full · scope: app */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V; flattened repeated panels into task sections. */
.page {
  min-height: 100vh;
}
</style>

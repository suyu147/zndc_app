<template>
  <view
    class="hr-avatar"
    :style="{
      width: size + 'rpx',
      height: size + 'rpx',
      background: bg,
      fontSize: size * 0.42 + 'rpx',
      borderRadius: square ? '16rpx' : '50%',
    }"
  >
    {{ text }}
  </view>
</template>

<script setup lang="ts">
/** 首字头像：按名称哈希稳定取色，避免每次渲染颜色跳动 */
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number;
    /** 圆角方形（企业 logo 用） */
    square?: boolean;
    /** 固定色，传入则不使用哈希取色 */
    color?: string;
  }>(),
  { size: 88, square: false, color: "" },
);

const PALETTE = ["var(--color-primary-soft)", "var(--color-surface)"];

const text = computed(() => (props.name || "—").trim().slice(0, 1));

const bg = computed(() => {
  if (props.color) return props.color;
  let hash = 0;
  for (let i = 0; i < props.name.length; i += 1) {
    hash = (hash * 31 + props.name.charCodeAt(i)) % 9973;
  }
  return PALETTE[hash % PALETTE.length];
});
</script>

<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */
.hr-avatar {
  color: var(--color-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
</style>

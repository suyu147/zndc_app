<template><view class="app-icon" :style="iconStyle" aria-hidden="true" /></template>
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ name: string; size?: number | string }>(), { size: 40 });
const known = new Set(["search","chevron-right","chevron-left","close","home","briefcase","chart","user","users","file","message","calendar","check","plus","target","shield","star","settings","logout","refresh","upload","mic","arrow-up","arrow-down","building","edit","filter","bell","layers","heart","info","clock"]);
const iconStyle = computed(() => { const name = known.has(props.name) ? props.name : 'info'; const url = 'url("/static/icons/' + name + '.svg")'; const size = typeof props.size === 'number' ? props.size + 'rpx' : /^\d+(\.\d+)?$/.test(props.size) ? props.size + 'px' : props.size; return { width: size, height: size, maskImage: url, WebkitMaskImage: url }; });
</script>
<style scoped>
/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */

/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: role list · states: existing · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared shell keeps task-specific screen layouts */
.app-icon { display: inline-block; flex-shrink: 0; vertical-align: middle; background-color: currentColor; mask-repeat: no-repeat; mask-position: center; mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; }
</style>

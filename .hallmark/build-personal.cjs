const fs = require('fs'); const path = require('path');
const root = process.cwd();
function put(file, text) { const abs=path.join(root,file); if(fs.existsSync(abs)){const backup=path.join(root,'.hallmark/original',file);if(!fs.existsSync(backup)){fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(abs,backup);}}fs.mkdirSync(path.dirname(abs),{recursive:true});fs.writeFileSync(abs,text.trim()+'\n'); }
function edit(file, template, css, transform = s => s) {const old=fs.readFileSync(file,'utf8');const script=old.match(/<script setup[^>]*>[\s\S]*?<\/script>/)[0]; put(file,`<template>\n${template}\n</template>\n\n${transform(script)}\n\n<style scoped>\n${stamp}\n${css}\n</style>`);}
const stamp='/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: role list · states: existing · v2.0.0 */\n/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared shell keeps task-specific screen layouts */';
put('tokens.css', `${stamp}
:root, page {
  --color-primary: #00857d;
  --color-accent: var(--color-primary);
  --color-brand: #00a6a5;
  --color-primary-soft: #e8f5f3;
  --color-paper: #ffffff;
  --color-surface: #f5f6f6;
  --color-paper-2: var(--color-surface);
  --color-paper-3: #edf0ef;
  --color-ink: #202725;
  --color-secondary: #626d69;
  --color-ink-2: var(--color-secondary);
  --color-muted: #74817c;
  --color-rule: #edf0ee;
  --color-danger: #c34e43;
  --color-warning: #95651f;
  --color-success: #258064;
  --color-mask: rgba(24, 39, 34, .42);
  --color-focus: var(--color-primary);
  --color-accent-ink: var(--color-paper);
  --color-transparent: transparent;
  --font-body: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  --font-display: var(--font-body);
  --text-xs: 22rpx;
  --text-sm: 24rpx;
  --text-md: 28rpx;
  --text-lg: 32rpx;
  --text-title: 36rpx;
  --text-section: 40rpx;
  --radius-card: 12rpx;
  --radius-input: 8rpx;
  --radius-pill: 999rpx;
  --shadow-card: none;
  --dur-micro: 120ms;
  --dur-short: 180ms;
  --ease-out: ease-out;
  --space-2xs: 4rpx;
  --space-xs: 8rpx;
  --space-sm: 16rpx;
  --space-md: 24rpx;
  --space-lg: 32rpx;
  --space-xl: 40rpx;
  --space-2xl: 48rpx;
  --space-3xl: 64rpx;
  --container: 520px;
}
`);
put('base.css', `${stamp}
* { box-sizing: border-box; }
html, body { overflow-x: clip; }
body { margin: 0; background: var(--color-surface); color: var(--color-ink); font-family: var(--font-body); -webkit-font-smoothing: antialiased; }
page { background: var(--color-surface); color: var(--color-ink); font-family: var(--font-body); font-size: var(--text-md); line-height: 1.55; }
button, input, textarea { font-family: var(--font-body); }
button { white-space: nowrap; }
button::after { border: none; }
input, textarea { caret-color: var(--color-primary); }
:focus-visible, [role="button"]:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; }
::selection { background: var(--color-primary-soft); color: var(--color-primary); }
button[disabled], [aria-disabled="true"] { opacity: .55; cursor: not-allowed; }
button:active, [role="button"]:active { opacity: .75; }
.card { background: var(--color-paper); border-radius: 0; padding: var(--space-lg); margin: var(--space-sm) 0 0; }
.section-title { display: flex; align-items: center; justify-content: space-between; color: var(--color-ink); font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-md); min-width: 0; overflow-wrap: break-word; }
.section-title::before, .hr-sec-title::before { display: none; }
.btn-primary, .btn-secondary, .btn-plain { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 88rpx; height: auto; line-height: 1.4; border-radius: var(--radius-input); padding: var(--space-md); font-size: 30rpx; font-weight: 500; box-shadow: none; }
.btn-primary { background: var(--color-primary); color: var(--color-paper); }
.btn-primary[disabled] { color: var(--color-paper); }
.btn-secondary { background: var(--color-primary-soft); color: var(--color-primary); }
.btn-plain { background: var(--color-paper); color: var(--color-secondary); border: 1px solid var(--color-rule); }
.cell { display: flex; justify-content: space-between; align-items: center; padding: var(--space-md) 0; border-bottom: 1px solid var(--color-rule); font-size: 29rpx; min-height: 104rpx; }
.cell:last-child { border-bottom: 0; }
.cell-value { color: var(--color-muted); font-size: var(--text-sm); }
.loading-text, .empty-text { text-align: center; color: var(--color-muted); font-size: var(--text-sm); padding: var(--space-3xl) var(--space-lg); }
.hr-page, .hr-page--plain { min-height: 100vh; background: var(--color-surface); padding-bottom: calc(136rpx + env(safe-area-inset-bottom)); }
.hr-card { background: var(--color-paper); border-radius: 0; padding: var(--space-lg); margin: var(--space-sm) 0 0; box-shadow: none; }
.hr-sec-title { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-md); }
.hr-sec-title-main { display: flex; align-items: center; flex: 1; min-width: 0; }
.hr-sec-more { font-size: var(--text-sm); font-weight: 400; color: var(--color-muted); padding-left: var(--space-sm); }
.hr-tag, .hr-badge { display: inline-block; font-size: var(--text-xs); color: var(--color-secondary); background: var(--color-surface); border-radius: var(--radius-input); padding: var(--space-2xs) var(--space-xs); margin-right: var(--space-xs); }
.hr-tag--primary, .hr-badge--open { color: var(--color-primary); background: var(--color-primary-soft); }
.hr-tag--danger { color: var(--color-danger); }
.hr-tag--success, .hr-badge--hired { color: var(--color-success); }
.hr-tag--warn, .hr-badge--paused, .hr-badge--offer, .hr-badge--new { color: var(--color-warning); }
.hr-badge--screening, .hr-badge--interview { color: var(--color-primary); }
.hr-badge--urgent { color: var(--color-danger); }
.hr-btn { min-height: 84rpx; line-height: 84rpx; border-radius: var(--radius-input); font-size: 29rpx; text-align: center; box-shadow: none; padding: 0 var(--space-md); }
.hr-btn--primary { background: var(--color-primary); color: var(--color-paper); }
.hr-btn--primary[disabled] { color: var(--color-paper); }
.hr-btn--ghost { background: var(--color-paper); color: var(--color-secondary); border: 1px solid var(--color-rule); }
.hr-btn--danger { background: var(--color-paper); color: var(--color-danger); border: 1px solid var(--color-rule); }
.hr-btn--sm { min-height: 64rpx; height: 64rpx; line-height: 64rpx; font-size: var(--text-sm); }
.hr-empty, .hr-loading { text-align: center; padding: var(--space-3xl) var(--space-lg); color: var(--color-muted); font-size: var(--text-sm); }
.hr-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-sm) 0; border-bottom: 1px solid var(--color-rule); font-size: 26rpx; }
.hr-row:last-child { border: 0; }
.hr-row-label { color: var(--color-secondary); flex-shrink: 0; }
.hr-row-value { color: var(--color-ink); text-align: right; padding-left: var(--space-md); }
.hr-action-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 800; display: flex; align-items: center; padding: var(--space-sm) var(--space-md) calc(16rpx + env(safe-area-inset-bottom)); background: var(--color-paper); border-top: 1px solid var(--color-rule); }
.hr-fab { position: fixed; right: 24rpx; bottom: calc(140rpx + env(safe-area-inset-bottom)); z-index: 850; width: 96rpx; height: 96rpx; border-radius: var(--radius-pill); background: var(--color-primary); color: var(--color-paper); display: flex; align-items: center; justify-content: center; font-size: 48rpx; }
@media (min-width: 768px) {
  uni-app { max-width: var(--container); margin-inline: auto; background: var(--color-paper); }
  uni-page-head, uni-tabbar, .hr-navbar, .admin-navbar, .hr-tabbar, .admin-tabbar, .hr-action-bar, .action-bar, .input-bar, .composer { max-width: var(--container); margin-inline: auto; }
  uni-page-head, uni-tabbar { left: 0; right: 0; }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
`);
const oldApp = fs.readFileSync('src/App.vue','utf8');put('src/App.vue', oldApp.replace(/<style>[\s\S]*?<\/style>/, `<style>\n${stamp}\n@import "../tokens.css";\n@import "../base.css";\n</style>`));
const icons = {
'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
'chevron-right':'<path d="m9 5 7 7-7 7"/>','chevron-left':'<path d="m15 5-7 7 7 7"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',home:'<path d="m3 10 9-7 9 7v11H3Z"/><path d="M9 21v-8h6v8"/>',briefcase:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c5 3 13 3 18 0M10 13h4"/>',chart:'<path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',users:'<circle cx="9" cy="7" r="3.5"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8m2 3a5 5 0 0 1 3 5"/>',file:'<path d="M14 2H5v20h14V7ZM14 2v6h5M8 12h8M8 16h8"/>',message:'<path d="M21 16a3 3 0 0 1-3 3H9l-6 3V5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3ZM7 8h10M7 12h7"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18M7 15h3m4 0h3"/>',check:'<path d="m4 12 5 5L20 6"/>',plus:'<path d="M12 4v16M4 12h16"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',shield:'<path d="m12 2 8 3v7c0 5-8 10-8 10S4 17 4 12V5ZM8 11l3 3 5-5"/>',star:'<path d="m12 2 3 6.5 7 1-5 5 1.2 7-6.2-3.3L5.8 22 7 14.5l-5-5 7-1Z"/>',settings:'<path d="m10 2-.6 3-2 .9-2.7-1-2 3.4L5 10v3l-2.3 1.8 2 3.4 2.7-1 2 .9L10 21h4l.6-3 2-.9 2.7 1 2-3.4L19 13v-3l2.3-1.7-2-3.4-2.7 1-2-.9L14 2Z"/><circle cx="12" cy="11.5" r="3"/>',logout:'<path d="M10 3H3v18h7M8 12h14m-5-5 5 5-5 5"/>',refresh:'<path d="M20 8a9 9 0 1 0 0 9M20 2v6h-6"/>',upload:'<path d="M12 16V2m-5 5 5-5 5 5M3 15v6h18v-6"/>',mic:'<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>','arrow-up':'<path d="M12 21V3m-7 7 7-7 7 7"/>','arrow-down':'<path d="M12 3v18m-7-7 7 7 7-7"/>',building:'<path d="M3 22V6h10v16M13 11h8v11M6 10h4m-4 4h4m-4 4h4m6-3h2m-2 4h2"/>',edit:'<path d="m16 3 5 5L8 21H3v-5ZM13 6l5 5"/>',filter:'<path d="M3 4h18l-7 8v8l-4 2V12Z"/>',bell:'<path d="M4 17h16l-2-4V8a6 6 0 0 0-12 0v5ZM9 21h6"/>',layers:'<path d="m2 7 10-5 10 5-10 5ZM2 12l10 5 10-5M2 17l10 5 10-5"/>',heart:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v1"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
};
for(const [name,shape] of Object.entries(icons))put(`src/static/icons/${name}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`);
put('src/components/AppIcon.vue', `<template><view class="app-icon" :style="iconStyle" aria-hidden="true" /></template>
<script setup lang="ts">
import { computed } from "vue";
const props = withDefaults(defineProps<{ name: string; size?: number | string }>(), { size: 40 });
const known = new Set(${JSON.stringify(Object.keys(icons))});
const iconStyle = computed(() => { const name = known.has(props.name) ? props.name : 'info'; const url = 'url("/static/icons/' + name + '.svg")'; const size = typeof props.size === 'number' ? props.size + 'rpx' : props.size; return { width: size, height: size, maskImage: url, WebkitMaskImage: url }; });
</script>
<style scoped>
${stamp}
.app-icon { display: inline-block; flex-shrink: 0; vertical-align: middle; background-color: currentColor; mask-repeat: no-repeat; mask-position: center; mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center; -webkit-mask-size: contain; }
</style>`);
put('src/main.ts',fs.readFileSync('src/main.ts','utf8').replace('import App from "./App.vue";', 'import App from "./App.vue";\nimport AppIcon from "./components/AppIcon.vue";').replace('const app = createSSRApp(App);','const app = createSSRApp(App);\n  app.component("AppIcon", AppIcon);'));
edit('src/pages/overview/overview.vue', `  <view class="page">
    <view class="header">
      <view class="header-top"><view><view class="hello">{{ greeting }}，{{ displayName || "职场人" }}</view><view class="hello-sub">发现适合你的岗位与能力机会</view></view><view class="health-pill" :class="healthClass" role="button" tabindex="0" @tap="checkHealth"><AppIcon name="shield" :size="30" /><text>{{ healthText }}</text></view></view>
      <view class="search-pill" role="button" tabindex="0" @tap="goJobs"><AppIcon name="search" :size="34" /><text class="search-text">搜索岗位名称 / 领域 / 技能</text><text class="search-btn">搜索</text></view>
    </view>
    <view v-if="overview" class="stats-grid"><view v-for="item in statItems" :key="item.label" class="stats-item"><view class="stats-value">{{ item.value }}</view><view class="stats-label">{{ item.label }}</view></view></view>
    <view v-if="recommendJobs.length" class="job-section">
      <view class="section-heading"><text class="section-title">为你推荐</text><text class="section-more" role="button" tabindex="0" @tap="goJobs">查看全部</text></view>
      <view v-for="job in recommendJobs" :key="job.id" class="job-card" role="button" tabindex="0" @tap="openJob(job)">
        <view class="job-head"><view class="job-name">{{ job.name }}</view><view class="job-posting">{{ job.postingCount }}<text> 条招聘</text></view></view>
        <view class="job-meta"><text>{{ job.field || "—" }}</text><text v-if="job.lastSeen">{{ job.lastSeen }}</text></view>
        <view class="job-tags"><text v-for="skill in job.skills.slice(0, 3)" :key="skill.id || skill.name" class="tag">{{ skill.name }}</text></view>
        <view class="job-bottom"><view class="job-identity"><view class="job-logo">{{ logoText(job.name) }}</view><text>岗位市场洞察</text></view><text class="trend-pill" :class="trendClass(job)">{{ job.trendLabel || "平稳" }}</text></view>
      </view>
    </view>
    <view v-if="overview" class="card data-section"><view class="section-title">数据规模</view><view class="row"><text class="row-label">图谱节点</text><text class="row-value">{{ formatCount(overview.nodeCount) }}</text></view><view class="row"><text class="row-label">图谱关系</text><text class="row-value">{{ formatCount(overview.relationCount) }}</text></view><view class="row"><text class="row-label">快照样本</text><text class="row-value">{{ formatCount(overview.snapshotCount) }}</text></view><view class="row"><text class="row-label">数据集 / 报告</text><text class="row-value">{{ overview.datasetCount }} / {{ overview.reportCount }}</text></view></view>
    <view v-if="loading && !overview" class="loading-text">加载中…</view>
  </view>`, `
.page { padding-bottom: 32rpx; }
.header { background: var(--color-paper); padding: 28rpx 32rpx 24rpx; }
.header-top { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; }
.hello { font-size: 36rpx; font-weight: 600; color: var(--color-ink); }
.hello-sub { margin-top: 8rpx; font-size: 24rpx; color: var(--color-muted); }
.health-pill { display: flex; align-items: center; gap: 6rpx; color: var(--color-secondary); font-size: 22rpx; min-height: 64rpx; }
.health-pill.ok { color: var(--color-primary); } .health-pill.err { color: var(--color-danger); }
.search-pill { display: flex; align-items: center; gap: 16rpx; background: var(--color-surface); border-radius: 8rpx; height: 80rpx; padding: 0 24rpx; margin-top: 28rpx; color: var(--color-muted); }
.search-text { flex: 1; font-size: 26rpx; }.search-btn { color: var(--color-primary); font-size: 26rpx; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 24rpx 16rpx; background: var(--color-paper); border-top: 1px solid var(--color-rule); }
.stats-item { text-align: center; border-right: 1px solid var(--color-rule); }.stats-item:last-child { border: 0; }
.stats-value { font-size: 34rpx; font-weight: 600; color: var(--color-ink); font-variant-numeric: tabular-nums; }.stats-label { color: var(--color-muted); font-size: 22rpx; margin-top: 8rpx; }
.job-section { margin-top: 16rpx; }.section-heading { display: flex; align-items: center; justify-content: space-between; background: var(--color-paper); padding: 28rpx 32rpx 8rpx; }.section-heading .section-title { margin: 0; }.section-more { font-size: 24rpx; color: var(--color-muted); padding: 8rpx 0; }
.job-card { background: var(--color-paper); padding: 28rpx 32rpx; margin-bottom: 8rpx; }.job-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }.job-name { font-size: 34rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }.job-posting { color: var(--color-primary); font-size: 32rpx; font-weight: 600; flex-shrink: 0; }.job-posting text { font-size: 22rpx; font-weight: 400; }
.job-meta { display: flex; flex-wrap: wrap; gap: 16rpx; color: var(--color-secondary); font-size: 24rpx; margin-top: 12rpx; }.job-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 16rpx; }.tag { color: var(--color-secondary); background: var(--color-surface); border-radius: 4rpx; padding: 4rpx 12rpx; font-size: 22rpx; }
.job-bottom { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-rule); margin-top: 24rpx; padding-top: 16rpx; }.job-identity { display: flex; align-items: center; gap: 12rpx; font-size: 23rpx; color: var(--color-secondary); }.job-logo { width: 40rpx; height: 40rpx; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 6rpx; display: flex; align-items: center; justify-content: center; font-size: 24rpx; }.trend-pill { font-size: 22rpx; color: var(--color-secondary); }.trend-up { color: var(--color-danger); }.trend-down { color: var(--color-success); }
.row { display: flex; justify-content: space-between; border-bottom: 1px solid var(--color-rule); padding: 16rpx 0; font-size: 26rpx; }.row:last-child { border: 0; }.row-label { color: var(--color-secondary); }.row-value { font-variant-numeric: tabular-nums; }
`);
edit('src/pages/jobs/jobs.vue', `  <view class="page">
    <view class="search-header"><view class="search-bar"><AppIcon name="search" :size="34" /><input v-model="keyword" class="search-input" placeholder="搜索岗位名称 / 领域 / 技能" aria-label="搜索岗位" confirm-type="search" @confirm="reload" /><view v-if="keyword" class="search-clear" role="button" tabindex="0" aria-label="清空搜索" @tap="keyword = ''; reload()"><AppIcon name="close" :size="30" /></view></view><view class="search-action" role="button" tabindex="0" @tap="reload">搜索</view></view>
    <view class="list-heading"><text>岗位探索</text><text v-if="jobs.length" class="list-count">{{ total }} 个岗位</text></view>
    <view v-if="jobs.length === 0 && !loading" class="empty-text">暂无岗位数据</view>
    <view v-for="job in jobs" :key="job.id" class="job-card" role="button" tabindex="0" @tap="openDetail(job)">
      <view class="job-head"><view class="job-name">{{ job.name }}</view><view class="job-count">{{ job.postingCount }}<text> 条招聘</text></view></view>
      <view class="job-field">{{ job.field || "—" }}</view>
      <view class="job-tags"><text v-for="skill in job.skills.slice(0, 4)" :key="skill.id || skill.name" class="tag">{{ skill.name }}</text></view>
      <view class="job-footer"><view class="job-identity"><view class="job-logo">{{ logoText(job.name) }}</view><view class="job-meta"><text>{{ job.trendLabel || "平稳" }}</text><text v-if="job.lastSeen">{{ job.lastSeen }}</text></view></view><view class="job-trend" :class="trendClass(job)"><text v-if="job.trendChangePp != null">{{ formatTrendPp(job.trendChangePp) }}</text><AppIcon name="chevron-right" :size="28" /></view></view>
    </view>
    <view v-if="loading" class="loading-text">加载中…</view><view v-else-if="hasMore && jobs.length > 0" class="loading-text">上拉加载更多</view><view v-else-if="jobs.length > 0" class="loading-text">共 {{ total }} 个岗位</view>
  </view>`, `
.page { padding-bottom: 32rpx; }.search-header { display: flex; align-items: center; gap: 24rpx; background: var(--color-paper); padding: 20rpx 32rpx; }.search-bar { display: flex; align-items: center; gap: 12rpx; flex: 1; min-width: 0; height: 76rpx; padding: 0 20rpx; background: var(--color-surface); color: var(--color-muted); border-radius: 8rpx; }.search-input { flex: 1; min-width: 0; font-size: 26rpx; color: var(--color-ink); }.search-clear { display: flex; align-items: center; min-height: 64rpx; }.search-action { color: var(--color-primary); font-size: 28rpx; padding: 16rpx 0; }.list-heading { display: flex; justify-content: space-between; align-items: center; background: var(--color-paper); padding: 16rpx 32rpx 24rpx; font-size: 32rpx; font-weight: 600; }.list-count { font-size: 23rpx; color: var(--color-muted); font-weight: 400; }
.job-card { background: var(--color-paper); margin-top: 8rpx; padding: 28rpx 32rpx; }.job-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16rpx; }.job-name { font-size: 34rpx; font-weight: 600; min-width: 0; overflow-wrap: break-word; }.job-count { color: var(--color-primary); font-size: 32rpx; font-weight: 600; flex-shrink: 0; }.job-count text { font-size: 22rpx; font-weight: 400; }.job-field { color: var(--color-secondary); font-size: 24rpx; margin-top: 12rpx; }.job-tags { display: flex; flex-wrap: wrap; gap: 8rpx; margin-top: 16rpx; }.tag { background: var(--color-surface); color: var(--color-secondary); font-size: 22rpx; border-radius: 4rpx; padding: 4rpx 12rpx; }.job-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--color-rule); padding-top: 16rpx; margin-top: 24rpx; gap: 12rpx; }.job-identity { display: flex; align-items: center; gap: 12rpx; min-width: 0; }.job-logo { display: flex; align-items: center; justify-content: center; width: 40rpx; height: 40rpx; border-radius: 6rpx; background: var(--color-primary-soft); color: var(--color-primary); font-size: 24rpx; flex-shrink: 0; }.job-meta { display: flex; flex-wrap: wrap; gap: 12rpx; font-size: 23rpx; color: var(--color-secondary); }.job-trend { display: flex; align-items: center; gap: 8rpx; font-size: 23rpx; color: var(--color-muted); }.trend-up { color: var(--color-danger); }.trend-down { color: var(--color-success); }
`);
edit('src/pages/login/login.vue', `  <view class="login-page">
    <view class="header-bg"><view class="logo-wrap"><view class="logo"><AppIcon name="briefcase" :size="56" /></view><view class="title">职能洞察</view><view class="subtitle">职业数据、岗位匹配与 AI 助手</view></view></view>
    <view class="form">
      <view class="portal-row"><view v-for="(item, index) in roleOptions" :key="item.value" class="portal-item" :class="{ active: portalIndex === index }" role="button" tabindex="0" @tap="portalIndex = index">{{ item.label }}</view></view>
      <view class="field"><text class="field-label">账号</text><input v-model="username" class="input" aria-label="账号" autocomplete="username" placeholder="请输入账号" :maxlength="80" /></view>
      <view class="field"><text class="field-label">密码</text><input v-model="password" class="input" aria-label="密码" autocomplete="current-password" placeholder="请输入密码" password :maxlength="200" @confirm="handleLogin" /></view>
      <button class="btn-primary" :disabled="loading" @tap="handleLogin">{{ loading ? "登录中…" : "登录" }}</button>
      <view class="tip">账号与 http://www.zndc.art 通用</view>
    </view>
    <view class="health-row"><AppIcon name="shield" :size="28" /><text class="health-label">服务状态</text><text class="health-value" :class="healthClass" role="button" tabindex="0" @tap="checkHealth">{{ healthText }}</text></view>
  </view>`, `
.login-page { min-height: 100vh; background: var(--color-paper); padding: 96rpx 48rpx 48rpx; }.header-bg { padding: 24rpx 0 48rpx; }.logo-wrap { text-align: left; }.logo { display: flex; align-items: center; justify-content: flex-start; color: var(--color-primary); margin-bottom: 24rpx; }.title { font-size: 52rpx; font-weight: 600; color: var(--color-ink); }.subtitle { font-size: 26rpx; color: var(--color-secondary); margin-top: 12rpx; }.form { padding-top: 16rpx; }.portal-row { display: flex; gap: 32rpx; border-bottom: 1px solid var(--color-rule); margin-bottom: 40rpx; }.portal-item { position: relative; color: var(--color-secondary); font-size: 27rpx; padding: 20rpx 0; white-space: nowrap; }.portal-item.active { color: var(--color-primary); }.portal-item.active::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 4rpx; border-radius: 2rpx; background: var(--color-primary); }.field { margin-bottom: 32rpx; }.field-label { display: block; color: var(--color-ink); font-size: 26rpx; margin-bottom: 16rpx; }.input { background: var(--color-surface); color: var(--color-ink); border-radius: 8rpx; height: 92rpx; padding: 0 24rpx; font-size: 30rpx; }.btn-primary { margin-top: 48rpx; }.tip { color: var(--color-muted); font-size: 23rpx; margin-top: 24rpx; text-align: center; }.health-row { display: flex; align-items: center; justify-content: center; gap: 12rpx; margin-top: 56rpx; font-size: 24rpx; color: var(--color-muted); }.health-value { color: var(--color-primary); padding: 12rpx 0; }.health-value.err { color: var(--color-danger); }.health-value.warn { color: var(--color-warning); }
`);
let profile=fs.readFileSync('src/pages/profile/profile.vue','utf8');profile=profile.replace('<view class="avatar">{{ roleEmoji }}</view>','<view class="avatar"><AppIcon name="user" :size="56" /></view>');const pIcons={'★':'star','●':'shield','☁':'layers','ℹ':'info','🏢':'building','⇄':'refresh','↵':'logout'};for(const [symbol,name] of Object.entries(pIcons))profile=profile.replace(new RegExp('(<view class="cell-icon [^\"]+">)'+symbol+'(<\\/view>)','g'),`$1<AppIcon name="${name}" :size="38" />$2`);profile=profile.replace(/<text class="arrow">›<\/text>/g,'<AppIcon class="arrow" name="chevron-right" :size="30" />');const pTemplate=profile.match(/<template>([\s\S]*?)<\/template>/)[1];edit('src/pages/profile/profile.vue',pTemplate,`
.page { padding-bottom: 40rpx; }.header { display: grid; grid-template-columns: 112rpx minmax(0, 1fr); grid-template-rows: auto auto; column-gap: 24rpx; padding: 48rpx 32rpx; background: var(--color-paper); }.avatar { grid-row: 1 / 3; display: flex; align-items: center; justify-content: center; background: var(--color-primary-soft); color: var(--color-primary); width: 112rpx; height: 112rpx; border-radius: 56rpx; }.user-name { font-size: 40rpx; font-weight: 600; align-self: end; color: var(--color-ink); }.user-role { font-size: 25rpx; color: var(--color-secondary); margin-top: 8rpx; }.menu-card { margin-top: 16rpx; padding: 0 32rpx; }.cell-left, .cell-right { display: flex; align-items: center; gap: 16rpx; min-width: 0; }.cell-icon { display: flex; align-items: center; justify-content: center; color: var(--color-secondary); width: 40rpx; height: 48rpx; }.cell-value { color: var(--color-muted); font-size: 24rpx; }.arrow { color: var(--color-muted); }.cell.logout { color: var(--color-danger); }.cell .ok { color: var(--color-primary); }.cell .err { color: var(--color-danger); }.cell .warn { color: var(--color-warning); }
`);
let detail=fs.readFileSync('src/pages/job-detail/job-detail.vue','utf8');detail=detail.replace('岗位 AI 服务</view>','求职准备</view>').replace('<view class="ai-icon ai-diagnosis">🎯</view>','<AppIcon class="ai-icon" name="target" :size="40" />').replace('<view class="ai-icon ai-assistant">🤖</view>','<AppIcon class="ai-icon" name="message" :size="40" />').replace('<view class="ai-icon ai-interview">🎤</view>','<AppIcon class="ai-icon" name="mic" :size="40" />');detail=detail.replace(/ · /g,' ');detail=detail.replace('</style>',`
.head-card { margin-top: 0; padding: 40rpx 32rpx 28rpx; }.job-logo { width: 80rpx; height: 80rpx; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 8rpx; font-size: 36rpx; }.name { font-size: 42rpx; font-weight: 600; }.trend { padding: 0; border-radius: 0; background: none; }.trend-line { padding-top: 16rpx; border-top: 1px solid var(--color-rule); }.meta { gap: 12rpx; }.ai-row { display: flex; flex-direction: column; }.ai-item { display: grid; grid-template-columns: 48rpx minmax(0,1fr) auto; gap: 16rpx; align-items: center; padding: 24rpx 0; border-bottom: 1px solid var(--color-rule); }.ai-item:last-child { border: 0; }.ai-icon { margin: 0; color: var(--color-primary); background: none; border-radius: 0; }.ai-name { font-size: 28rpx; font-weight: 500; }.ai-desc { font-size: 23rpx; }.company-logo { background: var(--color-surface); color: var(--color-secondary); border-radius: 8rpx; }.skill-bar, .bucket-bar { height: 10rpx; }.skill-bar-inner, .bucket-inner { background: var(--color-primary); }.action-bar { box-shadow: none; }.fav-action { border-radius: 8rpx; height: 84rpx; background: var(--color-primary); color: var(--color-paper); font-weight: 500; }.fav-action.favored { background: var(--color-primary-soft); color: var(--color-primary); border-color: var(--color-primary-soft); }
</style>`);put('src/pages/job-detail/job-detail.vue', detail);
put('index.html',fs.readFileSync('index.html','utf8').replace('<html>','<html lang="zh-CN">').replace('<title>职能洞察</title>','<title>职能洞察</title>\n    <meta name="description" content="职能洞察移动端，提供岗位探索、能力诊断、职业规划和招聘治理服务。" />'));
put('design.md',`# 职能洞察界面规范

## 方向
招聘类移动应用，参考 BOSS 直聘的信息密度与布局习惯，保持自身标识。
Genre: modern-minimal。Shape: app screen。Theme: existing teal brand。

## 设计变量
唯一来源是根目录 tokens.css，App.vue 导入 tokens.css 和 base.css。
白底导航和内容区，浅灰页面分区。青绿色仅用于主操作、选中状态和关键业务值。
文字分三级：--color-ink、--color-secondary、--color-muted。
状态使用 --color-danger、--color-warning、--color-success，配套文字而非只靠颜色。
字体统一系统中文无衬线，不引入外部字体请求。
正文 28rpx，主要列表标题 32–34rpx，辅助信息 22–24rpx。

## 布局
所有页面保持原导航与业务路由。个人端使用原生 Tab；HR 和治理端使用各自的五项导航。
内容以全宽白色列表或业务分区呈现，分区之间 8–16rpx 浅灰间隔。
岗位名称优先，招聘量右对齐，技能用灰底短标签。保留真实数据含义，不将招聘量伪装成薪资。
统计使用平面数字行，不加图标色块。详情使用自然分节，不套多层卡片。
移动端水平内边距 32rpx。桌面预览限制在 520px 并居中。

## 控件
主按钮实色、8rpx 圆角、84–92rpx 高；次操作使用文字或中性色边框。
图标使用 AppIcon 和 src/static/icons 的同一套线性图标，不使用 Emoji。
键盘 focus-visible 清晰，按钮点击目标至少 44px。交互信息支持现有 loading/empty/error 状态。
不新增假指标、不改接口逻辑。HR 数据继续标明演示版。

## 动效
无装饰性动画。仅短时状态反馈，支持 prefers-reduced-motion。

## Exports
tokens.css、base.css、src/components/AppIcon.vue。
`);
put('.hallmark/preflight.json',JSON.stringify({date:'2026-11-16',scope:'app',mode:'redesign',depth:'full',brand:'existing zndc teal, BOSS layout reference only',citations:['src/App.vue:14','src/pages.json:1','src/api/request.ts:1','src/hr/api.ts:1'],kept:['routes','events','API calls','business facts'],introduced:['semantic tokens','line icons','flat task sections'],git:'not a git repository; originals backed up',before:'.hallmark/before.json'},null,2));
console.log('Personal core pages, tokens, base and icon system written.');

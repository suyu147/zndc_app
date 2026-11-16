const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const root=process.cwd(),stamp='/* Hallmark · shape: app screen · genre: modern-minimal · theme: brand · redesign: full · nav: kept · signature: task list · states: existing · v2.0.0 */\n/* Hallmark · pre-emit critique: P4 H4 E4 S4 R5 V3 · weakest: V, shared tokens preserve distinct task layouts */';
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(p,x.name)):[path.join(p,x.name)]);}
function backup(p){const b=path.join('.hallmark/original',p);if(!fs.existsSync(b)){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(p,b);}}
const vars=new Map();function space(x){const key='--space-'+x.replace('.','p').replace('-','n');vars.set(key,x);return `var(${key})`;}
function roleColor(s){if(s.startsWith('var('))return s;let r,g,b,a=1;if(s[0]==='#'){let hex=s.slice(1);if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');r=parseInt(hex.slice(0,2),16);g=parseInt(hex.slice(2,4),16);b=parseInt(hex.slice(4,6),16);}else {const nums=s.match(/[\d.]+/g).map(Number);[r,g,b]=nums;a=nums[3]??1;}
if(a===0)return 'var(--color-transparent)';if(a<.6){if(Math.max(r,g,b)<90 && a>.2)return 'var(--color-mask)';if(Math.max(r,g,b)-Math.min(r,g,b)>40)return 'var(--color-primary-soft)';return 'var(--color-rule)';}
const max=Math.max(r,g,b),min=Math.min(r,g,b),avg=(r+g+b)/3;
if(max-min<30){if(avg>250)return 'var(--color-paper)';if(avg>231)return 'var(--color-surface)';if(avg>185)return 'var(--color-rule)';if(avg>125)return 'var(--color-muted)';if(avg>75)return 'var(--color-secondary)';return 'var(--color-ink)';}
if(min>210)return 'var(--color-surface)';if(avg>215)return 'var(--color-primary-soft)';
if(r>g*1.3&&r>b*1.2)return g>100?'var(--color-warning)':'var(--color-danger)';if(g>r*1.2&&g>b*1.2)return 'var(--color-success)';return 'var(--color-primary)';}
const sources=[...walk('src').filter(x=>x.endsWith('.vue')),'base.css'];
for(const p of sources){backup(p);let s=fs.readFileSync(p,'utf8');
if(p.endsWith('AppIcon.vue'))s=s.replace("typeof props.size === 'number' ? props.size + 'rpx' : props.size", "typeof props.size === 'number' ? props.size + 'rpx' : /^\\d+(\\.\\d+)?$/.test(props.size) ? props.size + 'px' : props.size");
// Colors in CSS, inline styles, and existing presentation-only color functions share roles.
s=s.replace(/#[\da-fA-F]{3,8}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*[\d.]+)?\s*\)/g,roleColor);
s=s.replace(/linear-gradient\([^;\n]+\)/g,'var(--color-primary)');
s=s.replace(/transition:\s*all\s+[^;]+;/g,'transition: color var(--dur-short), background-color var(--dur-short);').replace(/transition:\s*(?:width|height|top|left)[^;]+;/g,'transition: opacity var(--dur-short);').replace(/\b100vw\b/g,'100%');
s=s.replace(/box-shadow:\s*(?!none)[^;]+;/g,'box-shadow: none;').replace(/font-family:\s*[^;]+;/g,'font-family: var(--font-body);').replace(/letter-spacing:\s*(?!0)[\d.]+(?:px|rpx|em);/g,'letter-spacing: 0;');
s=s.replace(/((?:padding|margin)(?:-(?:top|right|bottom|left|inline|block))?|(?:row-|column-)?gap)\s*:\s*([^;}]+)/g,(all,prop,val)=>{const out=val.replace(/(?<![\w-])(-?\d*\.?\d+)(rpx|px|rem)\b/g,m=>space(m));return `${prop}: ${out}`;});
if(p.endsWith('.vue')){s=s.replace(/<style([^>]*)>\s*(?!\/\* Hallmark)/g,`<style$1>\n${stamp}\n`);s=s.replace(/<(view|text)\b((?:"[^"]*"|'[^']*'|[^>])*)>/g,(all,tag,attrs)=>{const tap=attrs.match(/@tap(?:\.[\w-]+)*="([^"]+)"/);if(!tap)return all;let add='';if(!/\brole=/.test(attrs))add+=' role="button"';if(!/\btabindex=/.test(attrs))add+=' tabindex="0"';if(tap[1]&&!/@keydown\.enter/.test(attrs))add+=` @keydown.enter.prevent.stop="${tap[1]}" @keydown.space.prevent.stop="${tap[1]}"`;return `<${tag}${attrs}${add}>`;});}
fs.writeFileSync(p,s);
}
let tokens=fs.readFileSync('tokens.css','utf8');tokens=tokens.replace(/\n  --space-(?:n?\d)[^\n]+/g,'');tokens=tokens.replace(/\n}\s*$/, '\n'+[...vars].map(([k,v])=>`  ${k}: ${v};`).join('\n')+'\n}\n');fs.writeFileSync('tokens.css',tokens);
// One icon family across all navigation surfaces.
let tab=fs.readFileSync('src/components/hr-tabbar.vue','utf8');const names=['home','briefcase','users','chart','user'];let i=0;tab=tab.replace(/<svg\b([\s\S]*?)>[\s\S]*?<\/svg>/g,(all,attrs)=>{const condition=attrs.match(/v-(?:if|else-if)="[^"]+"|v-else/);return `<AppIcon ${condition?.[0]||''} class="ico" name="${names[i++]}" :size="44" />`;});fs.writeFileSync('src/components/hr-tabbar.vue',tab);
let diag=fs.readFileSync('src/pages/diagnosis/diagnosis.vue','utf8');diag=diag.replace(/(class="tag tag-on"[\s\S]*?>)\s*{{ skill }}\s*/,'$1{{ skill }} <AppIcon name="close" size="12" />');fs.writeFileSync('src/pages/diagnosis/diagnosis.vue',diag);
const html=fs.readFileSync('index.html','utf8');fs.writeFileSync('index.html',html.replace('width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0','width=device-width, initial-scale=1.0'));
console.log('Normalized',sources.length,'stylesheets/components;',vars.size,'spacing tokens.');
// Local-only checks, compact report stored for inspection.
const lint=execFileSync('node',['C:/Users/lenovo/.codex/skills/hallmark/scripts/sloplint.mjs','src','tokens.css','base.css','--genre','modern-minimal','--scope','app','--json'],{encoding:'utf8',maxBuffer:20*1024*1024});fs.writeFileSync('.hallmark/after-static.json',lint);const report=JSON.parse(lint);console.log(JSON.stringify(report.summary));const grouped={};for(const f of report.findings){if(!['FAIL','REFLEX'].includes(f.grade))continue;const key=f.grade+' '+f.gate;(grouped[key]??=[]).push(f);}for(const [key,items]of Object.entries(grouped))console.log(key,items.length,JSON.stringify(items.slice(0,2)));

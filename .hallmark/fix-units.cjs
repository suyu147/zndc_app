const fs=require('fs');let s=fs.readFileSync('tokens.css','utf8');s=s.replace(/(-?[\d.]+)rpx/g,'calc($1 * var(--rpx))');s+='\n:root { --rpx: .5px; }\n';fs.writeFileSync('tokens.css',s);
let main=fs.readFileSync('src/main.ts','utf8');main=main.replace('const app = createSSRApp(App);',`const app = createSSRApp(App);
  // #ifdef H5
  const syncUnit = () => document.documentElement.style.setProperty("--rpx", (uni.upx2px(100) / 100) + "px");
  syncUnit();
  window.addEventListener("resize", syncUnit);
  // #endif`);fs.writeFileSync('src/main.ts',main);
let cap=fs.readFileSync('.hallmark/quick-capture.cjs','utf8');cap=cap.replace("await page.goto('http://127.0.0.1:5175/#/'+route);",`if(name!=='login')await page.evaluate(()=>localStorage.setItem('zndc_auth_session_v1',JSON.stringify({type:'string',data:JSON.stringify({accessToken:'local-ui-preview',expiresAt:Math.floor(Date.now()/1000)+3600,user:{id:'preview',username:'preview',displayName:'界面预览',role:'personal'}})})));await page.goto('http://127.0.0.1:5175/#/'+route);`);fs.writeFileSync('.hallmark/quick-capture.cjs',cap);

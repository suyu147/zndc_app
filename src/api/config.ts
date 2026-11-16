/**
 * API 基础地址配置
 *
 * - App（安卓/iOS）：原生网络层没有跨域限制，直接连服务器域名的接口。
 * - H5：浏览器受 CORS 限制（后端仅放行 localhost:5175 与其自有域名），
 *   因此走 vite.config.ts 里的 /api 代理，跑在 5175 端口即可正常访问。
 * - 站点域名：http://www.zndc.art（上了 HTTPS 后把下面两处换成 https://www.zndc.art/api/v1 即可）。
 */
let apiBase = "http://www.zndc.art/api/v1";
// #ifdef H5
apiBase = "/api/v1";
// #endif
export const API_BASE = apiBase;

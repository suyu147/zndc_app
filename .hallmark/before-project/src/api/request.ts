/**
 * 基于 uni.request 的统一请求封装
 * - 自动携带 Bearer Token
 * - 统一解析后端 envelope：{ code, message, data }
 * - 401 自动清除会话并跳转登录页
 */
import { API_BASE } from "./config";
import type { Envelope, LoginResult, UserInfo } from "./types";

const AUTH_STORAGE_KEY = "zndc_auth_session_v1";

export interface StoredSession {
  accessToken: string;
  expiresAt: number;
  user: UserInfo;
}

export function readSession(): StoredSession | null {
  try {
    const raw = uni.getStorageSync(AUTH_STORAGE_KEY) as string;
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (!session?.accessToken) return null;
    // 提前 60 秒视为过期
    if (session.expiresAt && session.expiresAt * 1000 <= Date.now() + 60_000) return null;
    return session;
  } catch {
    return null;
  }
}

export function writeSession(result: LoginResult) {
  const session: StoredSession = {
    accessToken: result.accessToken,
    expiresAt: result.expiresAt,
    user: result.user,
  };
  uni.setStorageSync(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  uni.removeStorageSync(AUTH_STORAGE_KEY);
}

export function requireLogin(): boolean {
  if (readSession()) return false;
  uni.reLaunch({ url: "/pages/login/login" });
  return true;
}

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: Record<string, unknown> | unknown[];
  params?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
  timeout?: number;
}

function buildUrl(url: string, params?: RequestOptions["params"]): string {
  let full = `${API_BASE}${url}`;
  if (params) {
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "" && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
    if (query) full += (full.includes("?") ? "&" : "?") + query;
  }
  return full;
}

export function request<T>(options: RequestOptions): Promise<T> {
  const session = readSession();
  if (options.auth !== false && !session) {
    uni.reLaunch({ url: "/pages/login/login" });
    return Promise.reject(new Error("请先登录"));
  }
  const header: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.accessToken) header.Authorization = `Bearer ${session.accessToken}`;

  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: buildUrl(options.url, options.params),
      method: options.method || "GET",
      data: options.data as never,
      header,
      timeout: options.timeout || 30000,
      success: (res) => {
        const status = res.statusCode || 0;
        if (status === 401) {
          clearSession();
          uni.reLaunch({ url: "/pages/login/login" });
          reject(new Error("登录状态无效或已过期"));
          return;
        }
        const body = res.data as Envelope<T>;
        if (status >= 200 && status < 300) {
          if (body && typeof body === "object" && "code" in body) {
            if (body.code === 0) resolve(body.data);
            else reject(new Error(body.message || "请求失败"));
          } else {
            resolve(res.data as T);
          }
          return;
        }
        const detail =
          (body && typeof body === "object" && "message" in body && body.message) ||
          (body && typeof body === "object" && "detail" in body && (body as Record<string, unknown>).detail as string) ||
          `请求失败(${status})`;
        reject(new Error(String(detail)));
      },
      fail: (err) => {
        reject(new Error(err?.errMsg?.includes("timeout") ? "请求超时，请检查网络" : "网络连接失败，请检查网络或服务器状态"));
      },
    });
  });
}

/** 附加选项：auth=false 表示该接口无需登录即可调用（如登录、健康检查） */
interface ExtraOptions {
  auth?: boolean;
  timeout?: number;
}

export function get<T>(url: string, params?: RequestOptions["params"], extra?: ExtraOptions): Promise<T> {
  return request<T>({ url, method: "GET", params, ...(extra || {}) });
}

export function post<T>(url: string, data?: unknown, extra?: ExtraOptions): Promise<T> {
  return request<T>({ url, method: "POST", data, ...(extra || {}) });
}

export function put<T>(url: string, data?: unknown, extra?: ExtraOptions): Promise<T> {
  return request<T>({ url, method: "PUT", data, ...(extra || {}) });
}

export function patch<T>(url: string, data?: unknown, extra?: ExtraOptions): Promise<T> {
  return request<T>({ url, method: "PATCH", data, ...(extra || {}) });
}

export function del<T>(url: string): Promise<T> {
  return request<T>({ url, method: "DELETE" });
}

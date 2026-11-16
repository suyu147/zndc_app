/**
 * 治理管理员端数据服务层
 *
 * 全部直连已部署的「职能洞察」网站后端 API（http://www.zndc.art/api/v1），
 * 对应后端 `docs/API接口清单-20260814.md` 的「管理台」章节。
 * 基础地址与统一鉴权（Bearer Token）来自 @/api/config 与 @/api/request，
 * JSON 类接口复用 request 封装，文件上传 / 表单类走本文件的专用助手。
 */

import { get, patch, put, post } from "@/api/request";
import { API_BASE } from "@/api/config";
import { readSession } from "@/api/request";
import type {
  CreateDatasetInput,
  DashboardData,
  DatasetItem,
  DatasetPage,
  DatasetRevision,
  GraphVersion,
  QualitySummary,
  ReviewActionPayload,
  ReviewDefinition,
  ReviewItem,
  UpdateDatasetInput,
  VersionList,
} from "./types";

/* ==================== 通用表单 / 多部件请求助手 ==================== */

function authHeader(): Record<string, string> {
  const session = readSession();
  return session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  let full = `${API_BASE}${path}`;
  if (params) {
    const query = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== "" && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
    if (query) full += (full.includes("?") ? "&" : "?") + query;
  }
  return full;
}

function toForm(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

/** 解析后端 envelope：{ code, message, data } */
function unwrap<T>(res: { statusCode: number; data: unknown }): T {
  const body = res.data as Record<string, unknown>;
  if (res.statusCode >= 200 && res.statusCode < 300) {
    if (body && typeof body === "object" && "code" in body) {
      if (body.code === 0) return body.data as T;
      throw new Error((body.message as string) || "请求失败");
    }
    return res.data as T;
  }
  if (res.statusCode === 401) throw new Error("登录状态无效或已过期");
  const detail =
    (body && typeof body === "object" && (body.message || body.detail)) || `请求失败(${res.statusCode})`;
  throw new Error(String(detail));
}

/** application/x-www-form-urlencoded 表单请求（用于后端 Form(...) 接收的接口） */
function formRequest<T>(
  method: "PUT" | "POST",
  path: string,
  fields: Record<string, string>,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    uni.request({
      url: buildUrl(path),
      method,
      header: { "Content-Type": "application/x-www-form-urlencoded", ...authHeader() },
      data: toForm(fields),
      success: (res) => {
        try {
          resolve(unwrap<T>(res as { statusCode: number; data: unknown }));
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) =>
        reject(new Error(err?.errMsg?.includes("timeout") ? "请求超时，请检查网络" : "网络连接失败")),
    });
  });
}

/* ==================== 治理仪表盘 ==================== */

export function getGovernanceDashboard(): Promise<DashboardData> {
  return get<DashboardData>("/admin/dashboard");
}

/* ==================== 数据资产（数据集） ==================== */

export function getDatasets(page = 1, pageSize = 20): Promise<DatasetPage> {
  return get<DatasetPage>("/datasets", { page, pageSize });
}

export function getDatasetRevisions(datasetId: string): Promise<DatasetRevision[]> {
  return get<DatasetRevision[]>(`/datasets/${encodeURIComponent(datasetId)}/revisions`);
}

export function syncDataset(datasetId: string): Promise<DatasetItem> {
  return post<DatasetItem>(`/datasets/${encodeURIComponent(datasetId)}/sync`);
}

export function updateDataset(datasetId: string, payload: UpdateDatasetInput): Promise<DatasetItem> {
  const fields: Record<string, string> = {};
  if (payload.name) fields.name = payload.name;
  if (payload.category) fields.category = payload.category;
  if (payload.version) fields.version = payload.version;
  if (payload.boundary) fields.boundary = payload.boundary;
  return formRequest<DatasetItem>("PUT", `/datasets/${encodeURIComponent(datasetId)}`, fields);
}

export function createDataset(input: CreateDatasetInput): Promise<DatasetItem> {
  const form: Record<string, string> = {
    name: input.name,
    boundary: input.boundary || "formal",
    syncGraph: input.syncGraph === false ? "false" : "true",
  };
  if (input.category) form.category = input.category;
  if (input.version) form.version = input.version;

  return new Promise<DatasetItem>((resolve, reject) => {
    uni.uploadFile({
      url: buildUrl("/datasets"),
      filePath: input.filePath,
      name: "file",
      formData: form,
      header: authHeader(),
      success: (res) => {
        try {
          const body = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
          resolve(unwrap<DatasetItem>({ statusCode: res.statusCode, data: body }));
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => reject(new Error(err?.errMsg || "上传失败，请检查文件或网络")),
    });
  });
}

/* ==================== 候选复核（岗位定义草稿） ==================== */

export function getReviews(status: "pending" | "approved" | "rejected" | "all" = "pending"): Promise<ReviewItem[]> {
  return get<ReviewItem[]>("/reviews", { status: status === "all" ? "" : status });
}

export function reviewAction(draftId: string, payload: ReviewActionPayload): Promise<{
  id: string;
  status: string;
  roleId: string;
  versionId: string;
}> {
  return patch<{ id: string; status: string; roleId: string; versionId: string }>(
    `/reviews/${encodeURIComponent(draftId)}`,
    payload,
  );
}

export function updateRoleDefinition(
  draftId: string,
  definition: ReviewDefinition,
): Promise<{ id: string; status: string; roleId: string; versionId: string }> {
  return put<{ id: string; status: string; roleId: string; versionId: string }>(
    `/admin/role-definitions/${encodeURIComponent(draftId)}`,
    { action: "update", definition },
  );
}

/* ==================== 图谱版本 ==================== */

export function getVersions(): Promise<VersionList> {
  return get<VersionList>("/admin/versions");
}

export function getVersion(versionId: string): Promise<GraphVersion> {
  return get<GraphVersion>(`/admin/versions/${encodeURIComponent(versionId)}`);
}

export function publishVersion(versionId: string): Promise<GraphVersion> {
  return post<GraphVersion>(`/admin/versions/${encodeURIComponent(versionId)}/publish`);
}

export function unpublishVersion(versionId: string): Promise<GraphVersion> {
  return post<GraphVersion>(`/admin/versions/${encodeURIComponent(versionId)}/unpublish`);
}

export function createVersionDraft(versionId: string): Promise<{
  draftId: string;
  roleId: string;
  roleName: string;
  created: boolean;
}> {
  return post<{ draftId: string; roleId: string; roleName: string; created: boolean }>(
    `/admin/versions/${encodeURIComponent(versionId)}/draft`,
  );
}

/* ==================== 数据质量 ==================== */

export function getQualitySummary(): Promise<QualitySummary> {
  return get<QualitySummary>("/quality/summary");
}

/** 打开"选择目标岗位"页并等待回传结果；未选中时 resolve(null) */
import type { JobSkill } from "@/api/types";

export interface PickedRole {
  roleId: string;
  roleName: string;
  field?: string;
  postingCount?: number;
  skills?: JobSkill[];
}

const PICK_EVENT = "zndc:rolePicked";

export function pickRole(skills: string[] = []): Promise<PickedRole | null> {
  return new Promise<PickedRole | null>((resolve) => {
    uni.$once(PICK_EVENT, (role: PickedRole | null) => resolve(role || null));
    const suffix = skills.length ? `?skills=${encodeURIComponent(JSON.stringify(skills.slice(0, 12)))}` : "";
    uni.navigateTo({
      url: `/pages/role-pick/role-pick${suffix}`,
      fail: () => {
        uni.$off(PICK_EVENT);
        resolve(null);
      },
    });
  });
}

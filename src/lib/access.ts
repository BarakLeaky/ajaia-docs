export type ShareRole = "viewer" | "editor";
export type Role = "owner" | ShareRole | null;

/** Single source of truth for "what can this user do with this document". */
export function resolveRole(ownerId: string, userId: string, shareRole?: ShareRole | null): Role {
  if (ownerId === userId) return "owner";
  return shareRole ?? null;
}

export const canView = (r: Role) => r !== null;
export const canEdit = (r: Role) => r === "owner" || r === "editor";
export const canManage = (r: Role) => r === "owner";

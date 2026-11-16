import { describe, expect, it } from "vitest";
import { canEdit, canManage, canView, resolveRole } from "./access";

describe("access control", () => {
  const owner = "u-owner";
  const other = "u-other";

  it("owner can view, edit and manage", () => {
    const r = resolveRole(owner, owner, null);
    expect(r).toBe("owner");
    expect(canView(r) && canEdit(r) && canManage(r)).toBe(true);
  });

  it("editor can view and edit but not manage sharing", () => {
    const r = resolveRole(owner, other, "editor");
    expect(canView(r)).toBe(true);
    expect(canEdit(r)).toBe(true);
    expect(canManage(r)).toBe(false);
  });

  it("viewer can only view", () => {
    const r = resolveRole(owner, other, "viewer");
    expect(canView(r)).toBe(true);
    expect(canEdit(r)).toBe(false);
    expect(canManage(r)).toBe(false);
  });

  it("a user with no share has no access", () => {
    const r = resolveRole(owner, other, null);
    expect(r).toBeNull();
    expect(canView(r) || canEdit(r) || canManage(r)).toBe(false);
  });

  it("ownership wins over a stale share row", () => {
    expect(resolveRole(owner, owner, "viewer")).toBe("owner");
  });
});

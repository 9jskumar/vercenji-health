// Permission keys checked on the server. Roles hold a list of these; "*" grants everything.
export const PERMISSIONS = {
  applicationsRead: "applications.read",
  applicationsUpdate: "applications.update",
  applicationsDocuments: "applications.documents",
  catalogueManage: "catalogue.manage",
  staffManage: "staff.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLES: { key: string; name: string; permissions: string[] }[] = [
  { key: "owner", name: "Owner", permissions: ["*"] },
  {
    key: "partnerships",
    name: "Partnerships team",
    permissions: [PERMISSIONS.applicationsRead, PERMISSIONS.applicationsUpdate, PERMISSIONS.applicationsDocuments],
  },
  { key: "catalogue", name: "Catalogue team", permissions: [PERMISSIONS.catalogueManage] },
];

export function hasPermission(granted: string[], needed: Permission) {
  return granted.includes("*") || granted.includes(needed);
}

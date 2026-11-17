// Permission keys checked on the server. Roles hold a list of these; "*" grants everything.
export const PERMISSIONS = {
  applicationsRead: "applications.read",
  applicationsUpdate: "applications.update",
  applicationsDocuments: "applications.documents",
  catalogueManage: "catalogue.manage",
  ordersManage: "orders.manage",
  staffManage: "staff.manage",
  careersManage: "careers.manage", // vacancies, departments, email templates and recruitment settings
  careersApplications: "careers.applications", // see candidates, change status, add notes, email candidates
  careersCvs: "careers.cvs", // download CVs and export candidate lists
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
  { key: "orders", name: "Orders team", permissions: [PERMISSIONS.ordersManage] },
  {
    key: "recruitment",
    name: "Recruitment team",
    permissions: [PERMISSIONS.careersManage, PERMISSIONS.careersApplications, PERMISSIONS.careersCvs],
  },
];

export function hasPermission(granted: string[], needed: Permission) {
  return granted.includes("*") || granted.includes(needed);
}

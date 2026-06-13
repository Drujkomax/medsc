// Role hierarchy — faithful copy of the DB's has_role_level(), now in app code.
// Ascending privilege: user < observer < accountant < engineer < salesperson
//                      < sales_manager < admin < director
export const ROLE_ORDER = [
  "user",
  "observer",
  "accountant",
  "engineer",
  "salesperson",
  "sales_manager",
  "admin",
  "director",
] as const;

export type Role = (typeof ROLE_ORDER)[number];

/** has_role_level: does the user hold any role at or above `min`? */
export function hasLevel(roles: string[], min: Role): boolean {
  const m = ROLE_ORDER.indexOf(min);
  return roles.some((r) => ROLE_ORDER.indexOf(r as Role) >= m);
}

/** has_role: does the user hold this exact role? */
export function hasRole(roles: string[], role: Role): boolean {
  return roles.includes(role);
}

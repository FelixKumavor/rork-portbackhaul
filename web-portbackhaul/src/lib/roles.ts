export const ROLES = [
  "CARGO_OWNER",
  "CLEARING_AGENT",
  "TRUCK_OWNER",
  "DRIVER",
  "LOADING_OPERATOR",
  "ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

/** Roles a person may select at registration. ADMIN is never self-assignable. */
export const SIGNUP_ROLES: readonly Role[] = [
  "CARGO_OWNER",
  "CLEARING_AGENT",
  "TRUCK_OWNER",
  "DRIVER",
  "LOADING_OPERATOR",
];

export const ROLE_LABEL: Record<Role, string> = {
  CARGO_OWNER: "Cargo Owner",
  CLEARING_AGENT: "Clearing Agent",
  TRUCK_OWNER: "Truck Owner",
  DRIVER: "Driver",
  LOADING_OPERATOR: "Loading / Terminal Operator",
  ADMIN: "Administrator",
};

export const ROLE_BLURB: Record<Role, string> = {
  CARGO_OWNER: "Create shipments, assign a clearing agent and track delivery.",
  CLEARING_AGENT: "Handle clearance, request verified trucks and monitor trips.",
  TRUCK_OWNER: "Register trucks, manage drivers and track earnings.",
  DRIVER: "Accept jobs, run trips and confirm delivery.",
  LOADING_OPERATOR: "Verify trip QR codes and confirm loading at the terminal.",
  ADMIN: "Platform operator.",
};

export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "BLOCKED";

export type VerificationStatus =
  | "NOT_SUBMITTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "MORE_INFO_REQUESTED"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export type AdminPermission =
  | "USER_APPROVE"
  | "USER_REJECT"
  | "USER_SUSPEND"
  | "USER_BLOCK"
  | "USER_UNBLOCK"
  | "DOCUMENT_REVIEW"
  | "USER_VIEW"
  | "ADMIN_VIEW"
  | "SETTINGS_MANAGE"
  | "PAYMENT_MANAGE"
  | "DISPUTE_MANAGE";

/** The dashboard home route for each role. */
export const ROLE_HOME: Record<Role, string> = {
  CARGO_OWNER: "/app/shipments",
  CLEARING_AGENT: "/app/agent/trips",
  TRUCK_OWNER: "/app/fleet",
  DRIVER: "/app/driver",
  LOADING_OPERATOR: "/app/loading",
  ADMIN: "/admin",
};

export const ACCOUNT_STATUS_MESSAGE: Record<Exclude<AccountStatus, "APPROVED">, string> = {
  PENDING: "Your account is under verification. You will receive a notification once your account has been reviewed.",
  REJECTED:
    "Your verification was not approved. Please review the reason and resubmit the required information if permitted.",
  SUSPENDED: "Your account is temporarily suspended. Please contact platform support for assistance.",
  BLOCKED:
    "Your account has been blocked from using this platform. Please contact platform support if you believe this was an error.",
};

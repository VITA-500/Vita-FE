export const planNetworkTypes = ["LTE", "5G", "LTE_5G"] as const;
export const planTargetGroups = [
  "GENERAL",
  "TEEN",
  "YOUTH",
  "SENIOR",
  "KIDS",
  "TABLET",
  "WATCH",
] as const;
export const planDataPolicies = ["LIMITED", "UNLIMITED"] as const;
export const planUsagePolicies = ["NONE", "LIMITED", "UNLIMITED"] as const;
export const planStatuses = ["ACTIVE", "INACTIVE"] as const;
export type PlanNetworkType = (typeof planNetworkTypes)[number];
export type PlanTargetGroup = (typeof planTargetGroups)[number];
export type PlanDataPolicy = (typeof planDataPolicies)[number];
export type PlanUsagePolicy = (typeof planUsagePolicies)[number];
export type PlanStatus = (typeof planStatuses)[number];
export type AdminPlan = {
  planId: number;
  planCode: string;
  name: string;
  summary: string;
  price: number;
  networkType: PlanNetworkType;
  targetGroup: PlanTargetGroup;
  minAge: number | null;
  maxAge: number | null;
  dataPolicy: PlanDataPolicy;
  baseDataMb: number | null;
  exhaustedSpeedKbps: number | null;
  voicePolicy: PlanUsagePolicy;
  voiceMinutes: number | null;
  smsPolicy: PlanUsagePolicy;
  smsCount: number | null;
  description: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string | null;
};
export type AdminPlanRequest = Omit<
  AdminPlan,
  "planId" | "status" | "createdAt" | "updatedAt"
>;

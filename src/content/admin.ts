import type { ApplicationStatus, PartnerModel } from "@/generated/prisma/enums";

export const statusLabels: Record<ApplicationStatus, string> = {
  NEW: "New application",
  UNDER_REVIEW: "Under review",
  INFO_REQUIRED: "Additional information required",
  MEETING_SCHEDULED: "Meeting scheduled",
  APPROVED_FOR_DISCUSSION: "Approved for discussion",
  NOT_PROCEEDING: "Not proceeding",
};

export const statusTone: Record<ApplicationStatus, string> = {
  NEW: "bg-[#FBF1DC] text-[#7A5A1E]",
  UNDER_REVIEW: "bg-[#E3ECF7] text-[#24456E]",
  INFO_REQUIRED: "bg-[#FBEAEA] text-[#9B2C2C]",
  MEETING_SCHEDULED: "bg-[#EDE7F6] text-[#4B2E83]",
  APPROVED_FOR_DISCUSSION: "bg-[#DCE6DC] text-forest",
  NOT_PROCEEDING: "bg-[#EEEEEC] text-stone",
};

export const modelLabels: Record<PartnerModel, string> = {
  WELLNESS_HUB: "Wellness Hub",
  HOME_DIET_NUTRITION: "Home Diet & Nutrition",
  WELLNESS_CORNER: "Wellness Corner",
  CLOUD_KITCHEN: "Cloud Kitchen",
  OTHER: "Other",
};

export const countryLabels: Record<string, string> = { IN: "India", AE: "UAE", ZZ: "Other" };

export const dateTime = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(d);

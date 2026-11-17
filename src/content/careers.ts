import type { CandidateStatus, EmploymentType, ExperienceLevel, JobStatus, WorkArrangement } from "@/generated/prisma/enums";

// Careers copy and form options. Wording approved in the owner's brief (2026-11-17).
// Benefits, salaries and promises are never added here: each vacancy states its own terms.

export const careersCopy = {
  seoTitle: "Careers at Vercenji | Explore Job Opportunities",
  seoDescription:
    "Explore exciting career opportunities at Vercenji. Join our growing team in nutrition, wellness, fitness, healthy food, operations, sales and marketing.",
  tagline: "Build Your Career. Create Better Living.",
  heading: "Build Your Career with Vercenji",
  subheading: "Be part of a growing wellness organisation where innovation, passion and purpose come together.",
  intro:
    "At Vercenji, we believe better living starts with people who are passionate about making a difference. We are building an integrated wellness ecosystem across nutrition, fitness, hydration, healthy food and lifestyle. Join our growing team and become part of a journey that inspires healthier choices and better living.",
  emptyState:
    "Currently, we don't have any open positions. However, we are always interested in connecting with talented and passionate individuals. Share your CV with us and we may contact you when a suitable opportunity becomes available.",
  speculativeTitle: "Submit Your Profile – Future Opportunities",
  thankYou:
    "Thank you for your interest in joining Vercenji. Your application has been successfully received. Our recruitment team will review your profile and contact you if your qualifications match our requirements.",
  consent:
    "I confirm that the information provided is accurate and consent to Vercenji processing my application and personal information for recruitment purposes in accordance with the Privacy Policy.",
};

export const whyWorkWithUs: { title: string; body: string; icon: "growth" | "spark" | "team" | "leaf" | "book" }[] = [
  { title: "Growth Opportunities", body: "Develop your professional skills and grow with the organisation.", icon: "growth" },
  { title: "Innovation", body: "Work across multiple business verticals and innovative wellness solutions.", icon: "spark" },
  { title: "Collaborative Culture", body: "Join a team that values teamwork, accountability and creativity.", icon: "team" },
  { title: "Purpose-Driven Work", body: "Contribute towards healthier lifestyles and better living.", icon: "leaf" },
  { title: "Professional Development", body: "Opportunities for continuous learning and development.", icon: "book" },
];

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

export const workArrangementLabels: Record<WorkArrangement, string> = {
  ON_SITE: "On-site",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
};

export const experienceLevelLabels: Record<ExperienceLevel, string> = {
  FRESHER: "Fresher (0 to 1 year)",
  JUNIOR: "1 to 3 years",
  MID: "3 to 6 years",
  SENIOR: "6 to 10 years",
  LEAD: "10+ years",
};

export const jobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  CLOSED: "Closed",
};

export const jobStatusTone: Record<JobStatus | "EXPIRED", string> = {
  DRAFT: "bg-[#EEEEEC] text-stone",
  PUBLISHED: "bg-[#DCE6DC] text-forest",
  PAUSED: "bg-[#FBF1DC] text-[#7A5A1E]",
  CLOSED: "bg-[#FBEAEA] text-[#9B2C2C]",
  EXPIRED: "bg-[#FBEAEA] text-[#9B2C2C]",
};

export const candidateStatusLabels: Record<CandidateStatus, string> = {
  NEW: "New application",
  UNDER_REVIEW: "Under review",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview scheduled",
  INTERVIEW_COMPLETED: "Interview completed",
  SELECTED: "Selected",
  REJECTED: "Rejected",
  ON_HOLD: "On hold",
};

export const candidateStatusTone: Record<CandidateStatus, string> = {
  NEW: "bg-[#FBF1DC] text-[#7A5A1E]",
  UNDER_REVIEW: "bg-[#E3ECF7] text-[#24456E]",
  SHORTLISTED: "bg-[#E6F0E0] text-[#2F5B1E]",
  INTERVIEW_SCHEDULED: "bg-[#EDE7F6] text-[#4B2E83]",
  INTERVIEW_COMPLETED: "bg-[#E8E4F0] text-[#3D3060]",
  SELECTED: "bg-[#DCE6DC] text-forest",
  REJECTED: "bg-[#EEEEEC] text-stone",
  ON_HOLD: "bg-[#F3EBDD] text-[#6B5320]",
};

/** The email template suggested when a candidate moves to a status. */
export const templateForStatus: Partial<Record<CandidateStatus, string>> = {
  SHORTLISTED: "shortlisted",
  INTERVIEW_SCHEDULED: "interview_invitation",
  SELECTED: "selected",
  REJECTED: "rejected",
  ON_HOLD: "on_hold",
  UNDER_REVIEW: "status_update",
  INTERVIEW_COMPLETED: "status_update",
};

export const templatePlaceholders: [string, string][] = [
  ["{{name}}", "Candidate's full name"],
  ["{{position}}", "Position applied for"],
  ["{{reference}}", "Application reference"],
  ["{{details}}", "Extra details you type when sending (for example interview date, time and place)"],
];

// Application form options. Stored as the label so exports read naturally.
export const experienceOptions = [
  "Fresher (less than 1 year)",
  "1 to 2 years",
  "2 to 4 years",
  "4 to 6 years",
  "6 to 10 years",
  "More than 10 years",
] as const;

export const employmentStatusOptions = [
  "Employed full-time",
  "Employed part-time",
  "Self-employed or freelance",
  "Not currently employed",
  "Student or recent graduate",
] as const;

export const educationOptions = [
  "10th / SSC",
  "12th / HSC",
  "Diploma",
  "Bachelor's degree",
  "Master's degree",
  "Doctorate",
  "Professional qualification (CA, CS, CMA or similar)",
  "Other",
] as const;

export const noticePeriodOptions = [
  "Immediately",
  "Within 15 days",
  "Within 30 days",
  "Within 60 days",
  "Within 90 days",
  "More than 90 days",
] as const;

export const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const dateOnly = (d: Date) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(d);

export function formatSalary(job: { salaryMin: number | null; salaryMax: number | null; salaryPeriod: string | null }) {
  const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;
  const per = job.salaryPeriod === "MONTH" ? "per month" : "per year";
  if (job.salaryMin && job.salaryMax) return `${inr(job.salaryMin)} to ${inr(job.salaryMax)} ${per}`;
  if (job.salaryMin) return `From ${inr(job.salaryMin)} ${per}`;
  if (job.salaryMax) return `Up to ${inr(job.salaryMax)} ${per}`;
  return null;
}

export const lines = (s: string | null | undefined) =>
  (s ?? "").split("\n").map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);

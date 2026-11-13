// States and union territories for Indian delivery addresses.
export const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export const orderStatusLabels = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
} as const;

export const orderStatusTone: Record<keyof typeof orderStatusLabels, string> = {
  PENDING_PAYMENT: "bg-[#FBF1DC] text-[#7A5A1E]",
  PAID: "bg-[#DCE6DC] text-forest",
  PROCESSING: "bg-[#E3ECF7] text-[#24456E]",
  SHIPPED: "bg-[#EDE7F6] text-[#4B2E83]",
  DELIVERED: "bg-[#DCE6DC] text-forest",
  CANCELLED: "bg-[#EEEEEC] text-stone",
  RETURN_REQUESTED: "bg-[#FBEAEA] text-[#9B2C2C]",
  RETURNED: "bg-[#EEEEEC] text-stone",
  REFUNDED: "bg-[#EEEEEC] text-stone",
};

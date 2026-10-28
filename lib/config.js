// Business rules live here so a change is one edit, not a hunt.
export const PLATFORM_FEE = 19;        // flat fee added to the customer's bill
export const COMMISSION = 0.12;        // share of job value Vanify keeps (partner side)
export const FREE_JOBS = 20;           // commission-free jobs for a new partner
export const CITY = "Hyderabad";
export const ZONES = [
  "Kukatpally", "Madhapur", "Gachibowli", "Kondapur",
  "Miyapur", "Ameerpet", "Secunderabad", "LB Nagar",
];
export const SLOTS = [
  "8:00 AM – 9:00 AM", "10:00 AM – 11:00 AM", "12:00 PM – 1:00 PM",
  "2:00 PM – 3:00 PM", "4:00 PM – 5:00 PM", "6:00 PM – 7:00 PM",
];
export const STATUS_FLOW = ["SEARCHING", "ACCEPTED", "ON_WAY", "STARTED", "COMPLETED"];
export const STATUS_LABEL = {
  SEARCHING: "Finding a professional",
  ACCEPTED: "Professional assigned",
  ON_WAY: "On the way",
  STARTED: "Work in progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function partnerPayout(jobValue, jobsDone) {
  const commission = jobsDone < FREE_JOBS ? 0 : Math.round(jobValue * COMMISSION);
  return { commission, net: jobValue - commission };
}

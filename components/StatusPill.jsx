import { STATUS_LABEL } from "@/lib/config";

const TONE = {
  SEARCHING: "amber", ACCEPTED: "blue", ON_WAY: "blue",
  STARTED: "blue", COMPLETED: "green", CANCELLED: "red",
};

export default function StatusPill({ status }) {
  return <span className={`pill ${TONE[status] || ""}`}>{STATUS_LABEL[status] || status}</span>;
}

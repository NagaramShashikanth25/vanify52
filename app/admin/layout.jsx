import OpsHeader from "@/components/OpsHeader";

export const metadata = { title: "Ops console" };

export default function AdminLayout({ children }) {
  return (
    <>
      <OpsHeader />
      <main style={{ background: "#F2F4F6", minHeight: "88vh", padding: "36px 0" }}>{children}</main>
    </>
  );
}

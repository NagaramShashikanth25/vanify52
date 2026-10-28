import PartnerStatusButton from "@/components/PartnerStatusButton";
import { listCategories, listPartners } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function AdminPartners() {
  const partners = await listPartners();
  const categories = await listCategories();
  const catName = (id) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="wrap">
      <h1 style={{ fontSize: "1.9rem" }}>Professionals</h1>
      <p className="muted mt8">Approving a professional lets them receive job requests immediately.</p>

      <div className="tablewrap mt24">
        <table>
          <thead>
            <tr><th>Name</th><th>Mobile</th><th>Trades</th><th>Areas</th><th>Rating</th><th>Jobs</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.name}</strong></td>
                <td>{p.phone}</td>
                <td>{p.skills.split(",").map(catName).filter(Boolean).join(", ")}</td>
                <td>{p.zones.split(",").join(", ")}</td>
                <td>{p.rating ? p.rating.toFixed(1) : "—"}</td>
                <td>{p.jobs_done}</td>
                <td>
                  <span className={`pill ${p.status === "APPROVED" ? "green" : p.status === "PENDING" ? "amber" : "red"}`}>
                    {p.status[0] + p.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="nowrap"><PartnerStatusButton id={p.id} status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

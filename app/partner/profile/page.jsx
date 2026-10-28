import PartnerHeader from "@/components/PartnerHeader";
import SiteFooter from "@/components/SiteFooter";
import CoverageEditor from "@/components/CoverageEditor";
import { currentUser } from "@/lib/auth";
import { listCategories } from "@/lib/repo";
import { ZONES } from "@/lib/config";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function PartnerProfile() {
  const user = await currentUser();
  const partner = user.partner;
  if (!partner) return null;

  return (
    <>
      <PartnerHeader />
      <main className="section flush" style={{ paddingTop: 44, minHeight: "70vh" }}>
        <div className="wrap narrow">
          <div className="row" style={{ gap: 16 }}>
            <span className="avatar lg">{initials(user.name)}</span>
            <div>
              <h1 style={{ fontSize: "1.7rem" }}>{user.name}</h1>
              <p className="sm muted">{user.phone}</p>
            </div>
          </div>

          <div className="card mt24">
            <div className="row between">
              <span>Verification</span>
              <span className={`pill ${partner.status === "APPROVED" ? "green" : partner.status === "PENDING" ? "amber" : "red"}`}>
                {partner.status === "APPROVED" ? "Verified" : partner.status === "PENDING" ? "Pending" : "Suspended"}
              </span>
            </div>
            <div className="row between mt16"><span>Rating</span><strong>{partner.rating ? `${partner.rating.toFixed(1)} ★` : "Not rated yet"}</strong></div>
            <div className="row between mt16"><span>Jobs completed</span><strong>{partner.jobs_done}</strong></div>
          </div>

          <CoverageEditor
            categories={await listCategories()}
            zones={ZONES}
            initialSkills={partner.skills.split(",").filter(Boolean)}
            initialZones={partner.zones.split(",").filter(Boolean)}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

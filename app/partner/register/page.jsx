import PartnerHeader from "@/components/PartnerHeader";
import SiteFooter from "@/components/SiteFooter";
import PartnerRegisterForm from "@/components/PartnerRegisterForm";
import { listCategories } from "@/lib/repo";
import { ZONES } from "@/lib/config";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Register as a professional" };

export default async function PartnerRegisterPage() {
  const categories = await listCategories();
  const user = await currentUser();

  return (
    <>
      <PartnerHeader />
      <main className="section flush" style={{ paddingTop: 48, minHeight: "70vh" }}>
        <div className="wrap narrow" style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: "1.9rem" }}>Register as a professional</h1>
          <p className="muted mt8">
            Our onboarding team calls you to verify your Aadhaar and address. Jobs start once you are approved.
          </p>
          <div className="panel mt24">
            <PartnerRegisterForm
              categories={categories}
              zones={ZONES}
              signedInAs={user ? { name: user.name, phone: user.phone } : null}
            />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

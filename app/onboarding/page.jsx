import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import OnboardingForm from "@/components/OnboardingForm";
import { currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "One more thing" };

export default async function OnboardingPage({ searchParams }) {
  const sp = await searchParams;
  const user = await currentUser();
  const next = safeNext(sp?.next, "/account/bookings");
  if (user?.phone) redirect(next);

  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 52, minHeight: "70vh" }}>
        <div className="wrap narrow" style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: "1.9rem" }}>Welcome, {user?.name?.split(" ")[0]}</h1>
          <p className="muted mt8">
            Your Google account is connected. We need a mobile number as well — it is how the
            professional reaches you at the door, and how we send your booking updates.
          </p>
          <div className="panel mt24">
            <OnboardingForm next={next} />
          </div>
          <p className="xs muted mt16">
            Signed in as {user?.email}. Your number is shared with one professional only after
            they accept your job.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

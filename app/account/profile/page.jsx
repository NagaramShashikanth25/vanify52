import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProfileEditor from "@/components/ProfileEditor";
import AddressManager from "@/components/AddressManager";
import { UserIcon } from "@/components/Icons";
import { pageUser } from "@/lib/auth";
import { listAddresses, listCategories } from "@/lib/repo";
import { ZONES } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

const roleLabels = {
  CUSTOMER: "Customer account",
  PARTNER: "Professional account",
  ADMIN: "Admin account",
};

export default async function AccountProfile() {
  const user = await pageUser();
  const partner = user.role === "PARTNER" ? user.partner : null;
  const [categories, addresses] = await Promise.all([
    partner ? listCategories() : Promise.resolve([]),
    user.role === "CUSTOMER" ? listAddresses(user.id) : Promise.resolve([]),
  ]);
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const memberSince = user.created_at
    ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(user.created_at))
    : "Date unavailable";
  const statusLabel = partner?.status === "APPROVED"
    ? "Approved"
    : partner?.status === "PENDING"
      ? "Pending review"
      : partner?.status === "SUSPENDED"
        ? "Suspended"
        : "";

  return (
    <>
      <SiteHeader />
      <main className="section flush profile-page">
        <div className="wrap narrow">
          <div className="profile-heading">
            <span className="avatar lg"><UserIcon size={28} /></span>
            <div>
              <p className="home-eyebrow">Your account</p>
              <h1>Profile</h1>
              <p className="sm muted">{roleLabels[user.role] || "Vanify account"}</p>
            </div>
          </div>

          <ProfileEditor name={user.name} email={user.email} phone={user.phone} />

          <section className="card profile-card mt16">
            <h2>Account details</h2>
            <div className="profile-facts mt16">
              <div><span>Account type</span><strong>{roleLabels[user.role] || "Vanify account"}</strong></div>
              <div><span>Member since</span><strong>{memberSince}</strong></div>
            </div>
          </section>

          {user.role === "CUSTOMER" && <AddressManager initialAddresses={addresses} zones={ZONES} />}

          {partner && (
            <section className="card profile-card mt16">
              <div className="row between">
                <h2>Professional details</h2>
                <span className={`pill ${partner.status === "APPROVED" ? "green" : partner.status === "PENDING" ? "amber" : "red"}`}>
                  {statusLabel}
                </span>
              </div>
              <div className="profile-facts mt16">
                <div><span>Rating</span><strong>{partner.rating ? `${partner.rating.toFixed(1)} ★` : "Not rated yet"}</strong></div>
                <div><span>Jobs completed</span><strong>{partner.jobs_done}</strong></div>
                <div><span>Trades</span><strong>{partner.skills.split(",").map((id) => categoryNames.get(id)).filter(Boolean).join(", ") || "Not set"}</strong></div>
                <div><span>Service areas</span><strong>{partner.zones.split(",").filter(Boolean).join(", ") || "Not set"}</strong></div>
              </div>
              <Link className="btn ghost mt16" href="/partner/profile">Edit trades and service areas</Link>
            </section>
          )}

          <section className="profile-shortcuts mt16" aria-label="Account shortcuts">
            {user.role === "CUSTOMER" && <Link className="card hover" href="/account/bookings">View my bookings</Link>}
            {user.role === "PARTNER" && <Link className="card hover" href="/partner/dashboard">Open professional dashboard</Link>}
            {user.role === "ADMIN" && <Link className="card hover" href="/admin">Open Ops console</Link>}
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AddToCart from "@/components/AddToCart";
import CartBar from "@/components/CartBar";
import { CategoryIcon } from "@/components/Icons";
import { getCategory, listApprovedPartners, listServices } from "@/lib/repo";
import { money } from "@/lib/format";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = await getCategory(slug);
  return { title: c ? c.name : "Service" };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const [services, approved, session] = await Promise.all([
    listServices(category.id), listApprovedPartners(), getSession(),
  ]);
  const pros = approved.filter((p) => p.skills.split(",").includes(category.id));
  const pricesVisible = Boolean(session);
  const registerHref = `/register?next=${encodeURIComponent(`/services/${category.id}`)}`;
  const loginHref = `/login?next=${encodeURIComponent(`/services/${category.id}`)}`;

  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 40 }}>
        <div className="wrap mid">
          <Link className="linkbtn" href="/services">← All services</Link>

          <div className="row between mt16" style={{ alignItems: "flex-start" }}>
            <div className="row" style={{ gap: 12 }}>
              <span style={{ color: "var(--green)" }}><CategoryIcon name={category.icon} size={30} /></span>
              <div>
                <h1 style={{ fontSize: "2.1rem" }}>{category.name}</h1>
                <p className="muted mt4">{category.blurb}</p>
              </div>
            </div>
            <span className="pill green">{pros.length} approved professional{pros.length === 1 ? "" : "s"}</span>
          </div>

          {!pros.length && (
            <div className="notice mt24" role="status">
              There are no approved professionals for this service yet. You can browse the catalogue, but booking requests may not be accepted until a professional is approved.
            </div>
          )}

          {!pricesVisible && (
            <div className="notice green mt16">
              Create a free account to see service prices and add services to your booking.{" "}
              <Link href={registerHref}>Create an account</Link> or <Link href={loginHref}>sign in</Link>.
            </div>
          )}

          <div className="card mt24">
            {services.map((s) => (
              <div className="svc" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="detail">{s.detail} · about {s.minutes} min</div>
                </div>
                <div className="right">
                  <div className={pricesVisible ? "price" : "price price-gated"}>
                    {pricesVisible ? s.price ? money(s.price) : "Free visit" : "Sign in to view price"}
                  </div>
                  {pricesVisible
                    ? <AddToCart serviceId={s.id} free={!s.price} />
                    : <Link className="btn ghost s mt8" href={registerHref}>Create account</Link>}
                </div>
              </div>
            ))}
          </div>

          <p className="xs muted mt16">
            Materials such as wires, pipes, washers and paint are billed at actual cost, and the
            professional shows you the bill before buying anything.
          </p>

          <CartBar />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

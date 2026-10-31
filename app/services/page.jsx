import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AddToCart from "@/components/AddToCart";
import CartBar from "@/components/CartBar";
import { CategoryIcon } from "@/components/Icons";
import { listCategories, listServices } from "@/lib/repo";
import { money } from "@/lib/format";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "All services" };

export default async function ServicesPage() {
  const [categories, services, session] = await Promise.all([
    listCategories(), listServices(), getSession(),
  ]);
  const pricesVisible = Boolean(session);

  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <div className="section-head">
            <h1 style={{ fontSize: "2.2rem" }}>All services</h1>
            <p>
              {pricesVisible
                ? "Listed prices are labour charges. Review the total before you send a booking request."
                : "Browse the service catalogue. Create a free account to view prices and continue to booking."}
            </p>
          </div>

          {categories.map((c) => (
            <div className="card mt24" key={c.id}>
              <div className="row between">
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ color: "var(--green)" }}><CategoryIcon name={c.icon} size={22} /></span>
                  <h3>{c.name}</h3>
                </div>
                <Link className="linkbtn" href={`/services/${c.id}`}>Open category</Link>
              </div>
              <div className="mt16">
                {services.filter((s) => s.category_id === c.id).map((s) => (
                  <div className="svc" key={s.id}>
                    <div>
                      <strong>{s.name}</strong>
                      <div className="detail">{s.detail}</div>
                    </div>
                    <div className="right">
                      <div className={pricesVisible ? "price" : "price price-gated"}>
                        {pricesVisible ? s.price ? money(s.price) : "Free visit" : "Sign in to view price"}
                      </div>
                      {pricesVisible
                        ? <AddToCart serviceId={s.id} free={!s.price} />
                        : <Link className="btn ghost s mt8" href="/register?next=%2Fservices">Create account</Link>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <CartBar />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

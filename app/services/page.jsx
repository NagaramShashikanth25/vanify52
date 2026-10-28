import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AddToCart from "@/components/AddToCart";
import CartBar from "@/components/CartBar";
import { CategoryIcon } from "@/components/Icons";
import { listCategories, listServices } from "@/lib/repo";
import { money } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "All services" };

export default async function ServicesPage() {
  const categories = await listCategories();
  const services = await listServices();

  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 48 }}>
        <div className="wrap">
          <div className="section-head">
            <h1 style={{ fontSize: "2.2rem" }}>All services</h1>
            <p>Fixed price per job. Add what you need and book one slot for all of it.</p>
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
                      <div className="price">{s.price ? money(s.price) : "Free visit"}</div>
                      <AddToCart serviceId={s.id} free={!s.price} />
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

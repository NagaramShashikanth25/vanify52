import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AddToCart from "@/components/AddToCart";
import CartBar from "@/components/CartBar";
import { CategoryIcon } from "@/components/Icons";
import { getCategory, listApprovedPartners, listServices } from "@/lib/repo";
import { money } from "@/lib/format";

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

  const services = await listServices(category.id);
  const pros = (await listApprovedPartners()).filter((p) => p.skills.split(",").includes(category.id));

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

          <div className="card mt24">
            {services.map((s) => (
              <div className="svc" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <div className="detail">{s.detail} · about {s.minutes} min</div>
                </div>
                <div className="right">
                  <div className="price">{s.price ? money(s.price) : "Free visit"}</div>
                  <AddToCart serviceId={s.id} free={!s.price} />
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

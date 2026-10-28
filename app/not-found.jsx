import Link from "next/link";
import SiteFooterClient from "@/components/SiteFooterClient";
import HeaderClient from "@/components/HeaderClient";

export default function NotFound() {
  return (
    <>
      <HeaderClient />
      <main className="section flush" style={{ paddingTop: 80, minHeight: "60vh" }}>
        <div className="wrap narrow center">
          <h1 style={{ fontSize: "2.4rem" }}>That page does not exist</h1>
          <p className="muted mt16">The link may be old, or the booking may belong to another account.</p>
          <Link className="btn mt24" href="/">Go to the home page</Link>
        </div>
      </main>
      <SiteFooterClient />
    </>
  );
}

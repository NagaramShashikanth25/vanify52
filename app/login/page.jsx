import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LoginForm from "@/components/LoginForm";
import GoogleButton from "@/components/GoogleButton";
import AuthError from "@/components/AuthError";
import { googleEnabled } from "@/lib/google";
import { showDemoLogins } from "@/lib/demo";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 48, minHeight: "70vh" }}>
        <div className="wrap narrow" style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: "1.9rem" }}>Sign in</h1>
          <p className="muted mt8">One account for customers, professionals and staff.</p>
          <div className="panel mt24">
            <AuthError code={sp?.error} />
            {googleEnabled() && (
              <>
                <Suspense fallback={null}>
                  <GoogleButton next={sp?.next || ""} label="Sign in with Google" />
                </Suspense>
                <div className="divider">or use your mobile number</div>
              </>
            )}
            <Suspense fallback={<p className="muted">Loading…</p>}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="sm mt16">
            New here? <Link href="/register">Create a customer account</Link> or{" "}
            <Link href="/partner/register">register as a professional</Link>.
          </p>
          {showDemoLogins() && (
            <div className="notice mt24">
              <strong>Demo accounts</strong> — password <code>password123</code> for all three.
              <div className="xs mt8">
                Customer 9999900000 · Professional 9876500001 (Ramesh, electrical) · Staff 9000000000
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

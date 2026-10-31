import { Suspense } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import LoginForm from "@/components/LoginForm";
import GoogleButton from "@/components/GoogleButton";
import AuthError from "@/components/AuthError";
import { googleEnabled } from "@/lib/google";
import { currentUser } from "@/lib/auth";
import { safeNext } from "@/lib/safe";
import { redirect } from "next/navigation";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const user = await currentUser();
  if (user) {
    const roleDestination = user.role === "ADMIN"
      ? "/admin"
      : user.role === "PARTNER"
        ? user.partner ? "/partner/dashboard" : "/partner/register"
        : "/account/bookings";
    const requestedDestination = safeNext(sp?.next, roleDestination);
    const destination = /^\/(login|register)(?:[?#]|$)/.test(requestedDestination)
      ? roleDestination
      : requestedDestination;
    redirect(destination);
  }

  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="wrap auth-wrap">
          <div className="auth-heading">
            <p className="auth-eyebrow">Welcome back</p>
            <h1>Sign in</h1>
            <p>Access your bookings and see service prices with your Vanify account.</p>
          </div>
          <div className="panel auth-panel">
            <AuthError code={sp?.error} />
            {googleEnabled() && (
              <>
                <Suspense fallback={null}>
                  <GoogleButton next={sp?.next || ""} label="Sign in with Google" />
                </Suspense>
                <div className="divider">or continue with email or mobile</div>
              </>
            )}
            <Suspense fallback={<p className="muted">Loading…</p>}>
              <LoginForm />
            </Suspense>
          </div>
          <p className="auth-switch">
            New to Vanify? <Link href="/register">Create a customer account</Link>
          </p>
          <p className="auth-partner">Joining as a service professional? <Link href="/partner/register">Register here</Link>.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

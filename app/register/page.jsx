import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RegisterForm from "@/components/RegisterForm";
import GoogleButton from "@/components/GoogleButton";
import { googleEnabled } from "@/lib/google";

export const metadata = { title: "Create an account" };

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;
  const next = typeof params?.next === "string" ? params.next : "";
  return (
    <>
      <SiteHeader />
      <main className="auth-page">
        <div className="wrap auth-wrap">
          <div className="auth-heading">
            <p className="auth-eyebrow">Get started with Vanify</p>
            <h1>Create your account</h1>
            <p>Create an account to view service prices and send booking requests.</p>
          </div>
          <div className="panel auth-panel">
            {googleEnabled() && (
              <>
                <GoogleButton next={next} label="Sign up with Google" />
                <div className="divider">or create an account with your details</div>
              </>
            )}
            <RegisterForm next={next} />
          </div>
          <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link>.</p>
          <p className="auth-partner">Joining as a service professional? <Link href="/partner/register">Register here</Link>.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

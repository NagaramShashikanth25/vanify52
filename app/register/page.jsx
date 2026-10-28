import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RegisterForm from "@/components/RegisterForm";
import GoogleButton from "@/components/GoogleButton";
import { googleEnabled } from "@/lib/google";

export const metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main className="section flush" style={{ paddingTop: 48, minHeight: "70vh" }}>
        <div className="wrap narrow" style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: "1.9rem" }}>Create your account</h1>
          <p className="muted mt8">You need one to book a professional and track the job.</p>
          <div className="panel mt24">
            {googleEnabled() && (
              <>
                <GoogleButton label="Sign up with Google" />
                <div className="divider">or sign up with your mobile number</div>
              </>
            )}
            <RegisterForm />
          </div>
          <p className="sm mt16">Already have an account? <Link href="/login">Sign in</Link>.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

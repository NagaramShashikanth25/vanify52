const MESSAGES = {
  google_not_configured: "Google sign-in is not set up on this deployment yet. Use your mobile number for now.",
  google_cancelled: "Google sign-in was cancelled. Nothing was changed.",
  google_state: "That sign-in link expired. Please try again.",
  google_failed: "We could not complete Google sign-in. Try again, or use your mobile number.",
  google_email_in_use:
    "That Google email is already on an account that signs in with a mobile number. Sign in with your number below.",
};

export default function AuthError({ code }) {
  if (!code) return null;
  return <div className="notice error" style={{ marginBottom: 16 }}>{MESSAGES[code] || "Something went wrong signing you in."}</div>;
}

import { checkPassword, newSession, SESSION_COOKIE } from "@/lib/auth";

// Relative Location headers: behind Nginx, req.url may say http:// even on https.
const redirect = (location: string, extra: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: location, ...extra } });

export async function POST(req: Request) {
  const form = await req.formData();

  if (!checkPassword(String(form.get("password") ?? ""))) {
    await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
    return redirect("/admin/login?error=1");
  }

  const session = newSession();
  const cookie = [
    `${SESSION_COOKIE}=${session.value}`,
    "Path=/",
    `Max-Age=${session.maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
    ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
  ].join("; ");
  return redirect("/admin", { "Set-Cookie": cookie });
}

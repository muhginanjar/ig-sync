import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Single-password admin. The session cookie is "<expiry>.<hmac>", signed with
// ADMIN_PASSWORD itself, so changing the password logs everyone out.

export const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 30;

function password() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 8) throw new Error("ADMIN_PASSWORD di .env belum diisi (minimal 8 karakter)");
  return pw;
}

const sign = (value: string) => createHmac("sha256", password()).update(value).digest("hex");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string) {
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(`pw:${input}`), sign(`pw:${password()}`));
}

export function newSession() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  return {
    value: `${expires}.${sign(`session:${expires}`)}`,
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export function isValidSession(value: string | undefined) {
  if (!value) return false;
  const [expires, mac] = value.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return safeEqual(mac, sign(`session:${expires}`));
}

export async function isAdmin() {
  return isValidSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For admin pages: bounce to the login form when not signed in. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** For admin API routes: a 401 response when not signed in, else null. */
export async function adminGuard() {
  return (await isAdmin()) ? null : Response.json({ error: "Tidak diizinkan" }, { status: 401 });
}

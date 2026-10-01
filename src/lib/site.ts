import { getSetting } from "./settings";

// Per-deployment identity. Nothing account-specific is hardcoded: the IG
// username comes from the token (saved by the sync), the URL from SITE_URL.

/** SITE_URL, accepting a bare domain ("ig.example.com" → https://ig.example.com). */
export function siteUrl(): URL | undefined {
  const raw = process.env.SITE_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    console.warn(`SITE_URL tidak valid: "${raw}"`);
    return undefined;
  }
}

/** Username of the connected Instagram account, without "@". */
export function accountUsername(): string | undefined {
  try {
    return getSetting("ig_username") ?? (process.env.IG_USERNAME || undefined);
  } catch {
    // Database not migrated yet.
    return process.env.IG_USERNAME || undefined;
  }
}

/** Display name: SITE_NAME if set, else "@username". */
export function siteName() {
  const username = accountUsername();
  return process.env.SITE_NAME?.trim() || (username ? `@${username}` : "Galeri Instagram");
}

/** Prefix for downloaded/shared file names, e.g. "infimate.rembook-<post>-1.jpg". */
export function filePrefix() {
  return accountUsername()?.replace(/[^\w.-]/g, "") || "post";
}

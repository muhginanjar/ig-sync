import { getSetting, setSetting } from "./settings";

const BASE = "https://graph.instagram.com";

const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "children{id,media_type,media_url,thumbnail_url}",
].join(",");

export type IgChild = {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url?: string; // omitted when IG blocks the media (e.g. copyrighted audio)
  thumbnail_url?: string;
};

export type IgMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  children?: { data: IgChild[] };
};

/** Token stored by the refresh job wins over the one in .env. */
export function getAccessToken(): string {
  const token = getSetting("ig_access_token") ?? process.env.IG_ACCESS_TOKEN;
  if (!token) throw new Error("IG_ACCESS_TOKEN belum diisi di .env");
  return token;
}

async function igGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(`Instagram API ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  }
  return body as T;
}

/** Yields every post on the account, newest first, following pagination. */
export async function* listAllMedia(): AsyncGenerator<IgMedia> {
  const params = new URLSearchParams({
    fields: MEDIA_FIELDS,
    limit: "50",
    access_token: getAccessToken(),
  });
  let next: string | undefined = `${BASE}/me/media?${params}`;
  while (next) {
    const page: { data: IgMedia[]; paging?: { next?: string } } = await igGet(next);
    yield* page.data;
    next = page.paging?.next;
  }
}

/** Extends the long-lived token by another 60 days. Token must be >24h old. */
export async function refreshAccessToken() {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: getAccessToken(),
  });
  const body = await igGet<{ access_token: string; expires_in: number }>(
    `${BASE}/refresh_access_token?${params}`,
  );
  const expiresAt = new Date(Date.now() + body.expires_in * 1000).toISOString();
  setSetting("ig_access_token", body.access_token);
  setSetting("ig_token_expires_at", expiresAt);
  return { expiresAt };
}

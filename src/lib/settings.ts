import { eq } from "drizzle-orm";
import { getDb, settings } from "@/db";

export function getSetting(key: string): string | undefined {
  return getDb().select().from(settings).where(eq(settings.key, key)).get()?.value;
}

export function setSetting(key: string, value: string) {
  getDb().insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

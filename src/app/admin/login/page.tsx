import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { isAdmin } from "@/lib/auth";

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <form method="post" action="/api/admin/login" className="mx-auto mt-12 max-w-sm space-y-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <LockKeyhole className="size-5" /> Masuk admin
      </h1>
      <input
        type="password"
        name="password"
        required
        autoFocus
        autoComplete="current-password"
        placeholder="Password"
        className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 dark:border-neutral-700"
      />
      {error && <p className="text-sm text-red-600">Password salah.</p>}
      <button className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 font-semibold text-white dark:bg-white dark:text-neutral-900">
        Masuk
      </button>
    </form>
  );
}

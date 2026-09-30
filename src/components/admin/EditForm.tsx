"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ExternalLink, LoaderCircle, Trash2 } from "lucide-react";
import { fromLocalInput, toLocalInput } from "./datetime";

export default function EditForm({ id, caption: initialCaption, postedAt }: {
  id: string;
  caption: string;
  postedAt: string; // ISO
}) {
  const router = useRouter();
  const initialWhen = toLocalInput(new Date(postedAt));
  const [caption, setCaption] = useState(initialCaption);
  const [when, setWhen] = useState(initialWhen);
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function call(method: "PATCH" | "DELETE", body?: unknown) {
    const res = await fetch(`/api/admin/posts/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setError("");
    try {
      await call("PATCH", {
        caption,
        // Only send the date when it changed, so a published post keeps its slot.
        ...(when !== initialWhen && { postedAt: fromLocalInput(when) }),
      });
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  async function remove() {
    if (!confirm("Hapus post ini dari aplikasi?")) return;
    setBusy("delete");
    try {
      await call("DELETE");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  const field =
    "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 dark:border-neutral-700";

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-neutral-500">
            <ChevronLeft className="size-5" />
          </Link>
          <h1 className="text-lg font-semibold">Edit post</h1>
        </div>
        <Link href={`/p/${id}`} className="flex items-center gap-1 text-sm text-neutral-500">
          Lihat <ExternalLink className="size-4" />
        </Link>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Caption</span>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} className={field} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Tanggal posting</span>
        <input
          type="datetime-local"
          value={when}
          min={when === initialWhen ? undefined : toLocalInput(new Date())}
          onChange={(e) => setWhen(e.target.value)}
          required
          className={field}
        />
      </label>

      <p className="text-xs text-neutral-500">
        Urutan dan isi foto/video tidak bisa diubah. Untuk mengganti, hapus post ini lalu buat baru.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={remove}
          disabled={busy !== null}
          className="flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-3 font-medium text-red-600 disabled:opacity-60 dark:border-red-900"
        >
          {busy === "delete" ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          Hapus
        </button>
        <button
          disabled={busy !== null}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {busy === "save" && <LoaderCircle className="size-5 animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  );
}

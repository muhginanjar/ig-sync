"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ImagePlus, LoaderCircle, Play, X } from "lucide-react";
import { fromLocalInput, toLocalInput } from "./datetime";
import { captureVideoFrame, contentTypeOf, putFile } from "./upload";

const MAX_FILES = 20;

type Item = { id: string; file: File; contentType: string; isVideo: boolean; preview: string };

type Prepared = {
  postId: string;
  files: {
    kind: "IMAGE" | "VIDEO";
    key: string;
    uploadUrl: string;
    coverKey?: string;
    coverUploadUrl?: string;
  }[];
};

async function api<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data as T;
}

export default function UploadForm() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState("");
  const [when, setWhen] = useState(() => toLocalInput(new Date()));
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // Free preview URLs when leaving the page.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const added = Array.from(list)
      .map((file) => ({ file, contentType: contentTypeOf(file) }))
      .filter(({ contentType }) => /^(image|video)\//.test(contentType))
      .map(({ file, contentType }) => ({
        id: crypto.randomUUID(),
        file,
        contentType,
        isVideo: contentType.startsWith("video/"),
        preview: URL.createObjectURL(file),
      }));
    setItems((prev) => [...prev, ...added].slice(0, MAX_FILES));
    if (input.current) input.current.value = "";
  }

  function move(index: number, by: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[index + by]] = [next[index + by], next[index]];
      return next;
    });
  }

  function remove(index: number) {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!items.length) return setError("Pilih minimal 1 foto atau video");
    if (new Date(when).getTime() < Date.now() - 60_000) {
      return setError("Tanggal posting harus sekarang atau di masa depan");
    }

    try {
      setProgress("Menyiapkan…");
      const prepared = await api<Prepared>("/api/admin/uploads", {
        files: items.map((i) => ({ contentType: i.contentType })),
      });

      const total = items.reduce((sum, i) => sum + i.file.size, 0);
      let done = 0;
      for (const [i, item] of items.entries()) {
        const target = prepared.files[i];
        if (target.coverUploadUrl) {
          setProgress(`Mengambil cover video ${i + 1}…`);
          const cover = await captureVideoFrame(item.file);
          await putFile(target.coverUploadUrl, cover, "image/jpeg", () => {});
        }
        await putFile(target.uploadUrl, item.file, item.contentType, (sent) => {
          const pct = Math.round(((done + sent) / total) * 100);
          setProgress(`Upload file ${i + 1}/${items.length} · ${pct}%`);
        });
        done += item.file.size;
      }

      setProgress("Menyimpan post…");
      await api("/api/admin/posts", {
        postId: prepared.postId,
        caption,
        postedAt: fromLocalInput(when),
        items: items.map((item, i) => ({
          key: prepared.files[i].key,
          kind: prepared.files[i].kind,
          contentType: item.contentType,
          coverKey: prepared.files[i].coverKey,
        })),
      });

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setProgress(null);
    }
  }

  const busy = progress !== null;
  const field =
    "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2.5 dark:border-neutral-700";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/admin" className="text-neutral-500">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-semibold">Post baru</h1>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item, i) => (
            <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-900">
              {item.isVideo ? (
                <video src={item.preview} muted playsInline className="size-full object-cover" />
              ) : (
                <img src={item.preview} alt="" className="size-full object-cover" />
              )}
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white">
                {i + 1}
              </span>
              {item.isVideo && <Play className="absolute right-1.5 top-1.5 size-4 text-white" fill="currentColor" />}
              {!busy && (
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 text-white">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 disabled:opacity-30" aria-label="Geser ke kiri">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove(i)} className="p-1.5" aria-label="Hapus">
                    <X className="size-4" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1.5 disabled:opacity-30" aria-label="Geser ke kanan">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {items.length < MAX_FILES && !busy && (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-300 text-sm text-neutral-500 dark:border-neutral-700"
            >
              <ImagePlus className="size-6" />
              Tambah
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          {items.length > 1
            ? `Carousel ${items.length} file. Urutan slide sesuai nomor; geser dengan tombol ‹ ›.`
            : `Foto/video, maksimal ${MAX_FILES} file (lebih dari 1 = carousel).`}
        </p>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Caption</span>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6} disabled={busy} className={field} />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Tanggal posting</span>
        <input
          type="datetime-local"
          value={when}
          min={toLocalInput(new Date())}
          onChange={(e) => setWhen(e.target.value)}
          disabled={busy}
          required
          className={field}
        />
        <span className="block text-xs text-neutral-500">
          Tanggal di masa depan = terjadwal, baru tampil saat waktunya tiba.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-70 dark:bg-white dark:text-neutral-900"
      >
        {busy && <LoaderCircle className="size-5 animate-spin" />}
        {progress ?? "Simpan post"}
      </button>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  Link,
  LoaderCircle,
  MessageCircle,
  RotateCw,
  Share2,
} from "lucide-react";
import type { ShareFile } from "./types";

// Below this total size, files are fetched as soon as the page opens so the
// share sheet can open instantly on tap. Bigger posts (videos) load on demand.
const AUTO_PREPARE_BYTES = 15 * 1024 * 1024;

type Status = "idle" | "preparing" | "ready" | "tap-again" | "error";

/** instagram.com/p/<code>/ → instagram.com/p/<code>/comments/ (same for /reel/). */
function commentsUrl(permalink: string) {
  const url = new URL(permalink);
  url.pathname = url.pathname.replace(/\/?$/, "/comments/");
  return url.toString();
}

async function fetchFiles(files: ShareFile[]) {
  return Promise.all(
    files.map(async (f) => {
      const res = await fetch(f.fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return new File([await res.blob()], f.filename, { type: f.contentType });
    }),
  );
}

export default function ShareActions({
  files,
  caption,
  permalink,
}: {
  files: ShareFile[];
  caption: string;
  permalink: string;
}) {
  const prepared = useRef<Promise<File[]> | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [toast, setToast] = useState("");

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const prepare = useCallback(() => {
    prepared.current ??= fetchFiles(files).then(
      (result) => {
        setStatus((s) => (s === "preparing" ? "tap-again" : "ready"));
        return result;
      },
      (err) => {
        prepared.current = null;
        setStatus("error");
        throw err;
      },
    );
    return prepared.current;
  }, [files]);

  useEffect(() => {
    const total = files.reduce((sum, f) => sum + f.sizeBytes, 0);
    if (total <= AUTO_PREPARE_BYTES) prepare().catch(() => {});
  }, [files, prepare]);

  /**
   * Instagram, TikTok & co. ignore text passed through the share sheet, so the
   * caption also goes to the clipboard. Started synchronously inside the tap,
   * before any await, because clipboard access needs the user gesture.
   */
  function copyCaptionInBackground() {
    if (!caption || !navigator.clipboard) return Promise.resolve(false);
    return navigator.clipboard.writeText(caption).then(
      () => true,
      () => false,
    );
  }

  async function shareLink() {
    const url = permalink; // share the original Instagram post, not this page
    if (navigator.share) {
      try {
        // No `title`: WhatsApp & others would prepend it and repeat the caption.
        await navigator.share({ text: caption || undefined, url });
      } catch (err) {
        if ((err as Error).name !== "AbortError") notify("Gagal membagikan link");
      }
    } else {
      await navigator.clipboard.writeText(caption ? `${caption}\n\n${url}` : url);
      notify(caption ? "Caption + link Instagram disalin" : "Link Instagram disalin");
    }
  }

  async function shareFiles() {
    if (!navigator.canShare) return shareLink(); // e.g. most desktop browsers
    const captionCopied = copyCaptionInBackground();

    const alreadyReady = status === "ready" || status === "tap-again";
    if (!alreadyReady) setStatus("preparing");

    let fileObjs: File[];
    try {
      fileObjs = await prepare();
    } catch {
      return notify("Gagal menyiapkan file, coba lagi");
    }

    if (!navigator.canShare({ files: fileObjs })) {
      notify("Perangkat ini tidak mendukung share file, membagikan link");
      return shareLink();
    }

    try {
      await navigator.share({ files: fileObjs, text: caption || undefined });
      setStatus("ready");
      if (await captionCopied) notify("Caption juga disalin, tempel jika belum muncul");
    } catch (err) {
      const name = (err as Error).name;
      // Browsers require share() to be called right after a tap. If preparing
      // the files took too long, the tap "expired" — ask for one more tap.
      if (name === "NotAllowedError") setStatus("tap-again");
      else if (name !== "AbortError") notify("Gagal membagikan");
    }
  }

  function download() {
    for (const f of files) {
      const a = document.createElement("a");
      a.href = `${f.fileUrl}?download=1`;
      a.download = f.filename;
      a.click();
    }
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption);
    notify("Caption disalin");
  }

  const kind =
    files.length > 1 ? `${files.length} file` : files[0]?.type === "VIDEO" ? "video" : "foto";
  const mainLabel = {
    idle: `Bagikan ${kind}`,
    ready: `Bagikan ${kind}`,
    preparing: "Menyiapkan file…",
    "tap-again": "File siap, tekan untuk bagikan",
    error: "Coba lagi",
  }[status];

  const MainIcon = status === "preparing" ? LoaderCircle : status === "error" ? RotateCw : Share2;

  const secondary =
    "flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900";

  return (
    <div className="space-y-2">
      <button
        onClick={shareFiles}
        disabled={status === "preparing"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-neutral-900"
      >
        <MainIcon className={`size-5 ${status === "preparing" ? "animate-spin" : ""}`} />
        {mainLabel}
      </button>
      <a
        href={commentsUrl(permalink)}
        target="_blank"
        rel="noreferrer"
        className={`${secondary} w-full py-2.5`}
      >
        <MessageCircle className="size-4" />
        Komentar di Instagram
      </a>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button onClick={shareLink} className={secondary}>
          <Link className="size-4" />
          Bagikan link IG
        </button>
        <button onClick={download} className={secondary}>
          <Download className="size-4" />
          Download
        </button>
        {caption && (
          <button onClick={copyCaption} className={secondary}>
            <Copy className="size-4" />
            Salin caption
          </button>
        )}
        <a href={permalink} target="_blank" rel="noreferrer" className={secondary}>
          <ExternalLink className="size-4" />
          Lihat di IG
        </a>
      </div>
      <p aria-live="polite" className="h-5 text-center text-sm text-neutral-500">
        {toast}
      </p>
    </div>
  );
}

import Link from "next/link";
import { CalendarClock, LogOut, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { isScheduled, listLocalPosts, parsePostedAt } from "@/lib/posts";

const formatWib = (postedAt: string) =>
  parsePostedAt(postedAt).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " WIB";

export default async function AdminPage() {
  await requireAdmin();
  const posts = listLocalPosts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Post khusus aplikasi</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/new"
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            <Plus className="size-4" /> Post baru
          </Link>
          <form method="post" action="/api/admin/logout">
            <button
              title="Keluar"
              className="rounded-lg border border-neutral-300 p-2 text-neutral-500 dark:border-neutral-700"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>

      {!posts.length && (
        <p className="py-12 text-center text-neutral-500">
          Belum ada post. Tekan <b>Post baru</b> untuk upload foto/video.
        </p>
      )}

      <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {posts.map((post) => {
          const scheduled = isScheduled(post);
          return (
            <li key={post.id} className="flex items-center gap-3 py-3">
              <Link href={`/p/${post.id}`} className="size-16 shrink-0 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-900">
                {post.gridKey && <img src={`/media/${post.gridKey}`} alt="" className="size-full object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{post.caption?.split("\n")[0] || <i className="text-neutral-400">Tanpa caption</i>}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                  {scheduled ? (
                    <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      <CalendarClock className="size-3" /> Terjadwal
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Tayang
                    </span>
                  )}
                  {formatWib(post.postedAt)}
                </p>
              </div>
              <Link
                href={`/admin/edit/${post.id}`}
                title="Edit"
                className="rounded-lg border border-neutral-300 p-2 text-neutral-500 dark:border-neutral-700"
              >
                <Pencil className="size-4" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

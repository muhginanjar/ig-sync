// Browser-side helpers for the upload form.

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

/** Some Android pickers leave file.type empty; fall back to the extension. */
export function contentTypeOf(file: File) {
  return file.type || EXT_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""] || "";
}

/** PUT to a presigned Wasabi URL, reporting bytes sent. */
export function putFile(url: string, body: Blob, contentType: string, onProgress: (sent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () =>
      xhr.status < 300 ? resolve() : reject(new Error(`Upload gagal (HTTP ${xhr.status})`));
    // A CORS rejection looks exactly like a network error to the browser.
    xhr.onerror = () =>
      reject(new Error("Upload gagal. Cek koneksi, atau jalankan `npm run storage:cors` di server."));
    xhr.send(body);
  });
}

/** Grabs a frame near the start of a video as the cover image (JPEG). */
export function captureVideoFrame(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let done = false;

    const finish = (blob: Blob | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      if (blob) resolve(blob);
      else placeholderCover().then(resolve);
    };
    // Formats the browser can't decode (e.g. HEVC .mov on some desktops) never load.
    const timer = setTimeout(() => finish(null), 15_000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => finish(null);
    video.onloadeddata = () => {
      video.pause();
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      canvas.toBlob(finish, "image/jpeg", 0.85);
    };
    video.src = url;
    video.load();
    // iOS only fetches video data once playback starts (muted inline is allowed).
    video.play().catch(() => {});
  });
}

/** Dark 4:5 image with a play symbol, used when no frame can be read. */
function placeholderCover(): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#262626";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e5e5e5";
  ctx.beginPath();
  ctx.moveTo(460, 555);
  ctx.lineTo(460, 795);
  ctx.lineTo(660, 675);
  ctx.fill();
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.85));
}

import sharp from "sharp";
import { putObject } from "./storage";

/** Small square WebP for the grid (~30 KB instead of a full-size original). */
export async function uploadGridThumb(cover: Buffer, dir: string) {
  const key = `${dir}/grid.webp`;
  const webp = await sharp(cover)
    .rotate() // respect EXIF orientation
    .resize(480, 480, { fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();
  await putObject(key, webp, "image/webp");
  return key;
}

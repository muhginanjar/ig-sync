import "dotenv/config";
import { configureBucketCors } from "@/lib/storage";

// Allows the admin page to upload files straight from the browser to Wasabi.
// Run once (and again if SITE_URL changes): npm run storage:cors
const site = process.env.SITE_URL;
if (!site || site.includes("localhost")) {
  console.error("Isi SITE_URL di .env dengan domain aplikasi, misalnya https://ig.umrohmate.com");
  process.exit(1);
}
const origins = [new URL(site).origin];

configureBucketCors(origins)
  .then(() => console.log(`CORS bucket diatur untuk: ${origins.join(", ")}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

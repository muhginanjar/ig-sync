import "dotenv/config";
import { configureBucketCors } from "@/lib/storage";
import { siteUrl } from "@/lib/site";

// Allows the admin page to upload files straight from the browser to Wasabi.
// Run once (and again if SITE_URL changes): npm run storage:cors
const site = siteUrl();
if (!site || site.hostname === "localhost") {
  console.error("Isi SITE_URL di .env dengan domain aplikasi, misalnya https://ig.example.com");
  process.exit(1);
}
const origins = [site.origin];

configureBucketCors(origins)
  .then(() => console.log(`CORS bucket diatur untuk: ${origins.join(", ")}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

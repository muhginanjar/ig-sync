import "dotenv/config";
import { syncInstagram } from "@/lib/sync";

// npm run sync           → only new posts
// npm run sync -- --full → re-download everything
syncInstagram({ full: process.argv.includes("--full") }).catch((err) => {
  console.error(err);
  process.exit(1);
});

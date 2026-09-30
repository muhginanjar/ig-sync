import "dotenv/config";
import { migrateDb } from "@/db";
import { syncInstagram } from "@/lib/sync";

// npm run sync           → only new posts
// npm run sync -- --full → re-download everything
migrateDb();
syncInstagram({ full: process.argv.includes("--full") }).catch((err) => {
  console.error(err);
  process.exit(1);
});

import "dotenv/config";
import { refreshAccessToken } from "@/lib/instagram";

refreshAccessToken()
  .then(({ expiresAt }) => console.log(`Token diperpanjang, berlaku sampai ${expiresAt}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

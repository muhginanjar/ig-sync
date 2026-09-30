// PM2 config. Start with: pm2 start ecosystem.config.cjs
// Next.js reads .env itself, but picks its port before doing so, so PORT
// is loaded here and passed to the process. The tsx scripts use dotenv too.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const PORT = process.env.PORT || "3000";

module.exports = {
  apps: [
    {
      name: "ig-sync-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      // SQLite = single writer on one machine, so one instance in fork mode.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      env: { NODE_ENV: "production", PORT },
    },
    {
      // Pull new posts from Instagram every 30 minutes.
      name: "ig-sync-cron-sync",
      cwd: __dirname,
      script: "node_modules/.bin/tsx",
      args: "scripts/sync.ts",
      interpreter: "none",
      cron_restart: "*/30 * * * *",
      autorestart: false,
      env: { NODE_ENV: "production" },
    },
    {
      // Extend the IG token every Monday 03:00 (token lives 60 days).
      name: "ig-sync-cron-token",
      cwd: __dirname,
      script: "node_modules/.bin/tsx",
      args: "scripts/refresh-token.ts",
      interpreter: "none",
      cron_restart: "0 3 * * 1",
      autorestart: false,
      env: { NODE_ENV: "production" },
    },
  ],
};

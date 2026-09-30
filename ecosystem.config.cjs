// PM2 config. Start with: pm2 start ecosystem.config.cjs
// Next.js reads .env itself; the tsx scripts load it via dotenv.
module.exports = {
  apps: [
    {
      name: "ig-sync-web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      // SQLite = single writer on one machine, so one instance in fork mode.
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "500M",
      env: { NODE_ENV: "production" },
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

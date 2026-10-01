// PM2 config. Start with: pm2 start ecosystem.config.cjs
// Next.js and the tsx scripts read .env themselves on every (re)start. Only
// PORT is needed here, because Next picks its port before reading .env.
//
// .env is parsed, NOT loaded into process.env: PM2 copies this process's
// environment into the apps and keeps it across reloads, which would pin
// old values (password, token) even after .env changes.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const dotenv = require("dotenv");
/* eslint-enable @typescript-eslint/no-require-imports */

const envFile = `${__dirname}/.env`;
const fileEnv = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};
const PORT = fileEnv.PORT || "3000";

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

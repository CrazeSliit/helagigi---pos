import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // Migrations need the direct connection; the app uses DATABASE_URL_POOLED.
  datasource: { url: env("DATABASE_URL") },
});

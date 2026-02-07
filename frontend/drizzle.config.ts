import { defineConfig } from "drizzle-kit";

// Remove dotenv import and usage - environment variables should be injected at runtime
// The DATABASE_URL should be provided via environment variables in deployment


export default defineConfig({
  schema: "./db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

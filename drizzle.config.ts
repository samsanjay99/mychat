import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Set the database URL explicitly if not already set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Dq6rtzjQMpG9@ep-noisy-wind-a8ixyics-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});

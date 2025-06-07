import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Set the database URL explicitly if not already set
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Dq6rtzjQMpG9@ep-noisy-wind-a8ixyics-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

// Configure neon to use ws
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

async function main() {
  console.log("Creating database connection...");
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  console.log("Running SQL query to create tables...");
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        schat_id TEXT NOT NULL UNIQUE,
        profile_image_url TEXT,
        status TEXT DEFAULT 'Hey there! I am using Schat.',
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created users table");

    // Create chats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id),
        user2_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created chats table");

    // Create messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id),
        sender_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created messages table");

    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error); 
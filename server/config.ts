import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Secret } from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Database configuration
export const DATABASE_URL = process.env.DATABASE_URL || "";

// JWT configuration
export const JWT_SECRET: Secret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
export const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

// Server configuration
export const PORT = process.env.PORT || 5000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate required environment variables
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set in environment variables");
} 
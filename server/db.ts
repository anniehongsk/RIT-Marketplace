import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSQLite } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import ws from "ws";
import * as pgSchema from "@shared/schema";
import * as sqliteSchema from "@shared/sqlite-schema";
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Define database type
type DatabaseType = 'postgres' | 'sqlite';

// Get database type from environment or use SQLite as fallback
const DB_TYPE: DatabaseType = (process.env.DB_TYPE as DatabaseType) || 'sqlite';

// Create DB directory if it doesn't exist for SQLite
const dbDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Create appropriate database instance
let db: any;

// Define pool at module level
let pool: Pool | undefined;

if (DB_TYPE === 'postgres') {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set for PostgreSQL. Did you forget to provision a database?",
    );
  }
  
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema: pgSchema });
  
  console.log("Using PostgreSQL database");
} else {
  // SQLite setup
  const dbPath = path.join(dbDir, 'sqlite.db');
  const sqlite = new Database(dbPath);
  
  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');
  
  db = drizzleSQLite(sqlite, { schema: sqliteSchema });
  
  // Create tables if they don't exist
  try {
    // This is a simple migration approach for SQLite
    const migrationFolderPath = path.join(process.cwd(), 'drizzle/sqlite');
    if (fs.existsSync(migrationFolderPath)) {
      migrate(db, { migrationsFolder: migrationFolderPath });
    } else {
      console.log("No migrations folder found, creating tables directly");
      // Create tables directly if no migrations folder
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          accepted_terms INTEGER DEFAULT 0
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          price INTEGER NOT NULL,
          condition TEXT NOT NULL,
          category TEXT NOT NULL,
          location TEXT NOT NULL,
          images TEXT NOT NULL,
          is_sold INTEGER DEFAULT 0,
          allow_campus_meetup INTEGER DEFAULT 1,
          allow_delivery INTEGER DEFAULT 0,
          allow_pickup INTEGER DEFAULT 0,
          seller_id INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          buyer_id INTEGER NOT NULL,
          seller_id INTEGER NOT NULL,
          order_type TEXT,
          is_completed INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id INTEGER NOT NULL,
          sender_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }
  } catch (error) {
    console.error("Error creating SQLite tables:", error);
  }
  
  console.log("Using SQLite database at", dbPath);
}

export { db, pool };
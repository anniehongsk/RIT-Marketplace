// Simple script to initialize SQLite database
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Make sure the db directory exists
const dbDir = path.join(process.cwd(), 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const sqlite = new Database(path.join(dbDir, 'sqlite.db'));

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Execute SQL to create tables
console.log('Creating tables in SQLite database...');

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
  
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    session TEXT NOT NULL,
    expires INTEGER
  );
`);

console.log('SQLite database setup completed!');
console.log(`Database file location: ${path.join(dbDir, 'sqlite.db')}`);
console.log('You can now open this file with DB Browser for SQLite');
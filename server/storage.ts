import { db } from "./db";
import { users, products, chats, messages, type User, type InsertUser, type Product, type InsertProduct, type Chat, type InsertChat, type Message, type InsertMessage, type UpdateChat } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { eq, and, like, gte, lte, or } from "drizzle-orm";
import { pool } from "./db"; // Only used for PostgreSQL
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import SQLiteStore from "connect-sqlite3";

// Get database type from environment
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// Create DB directory if it doesn't exist (for SQLite)
const dbDir = join(process.cwd(), 'db');
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Memory store fallback
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  acceptTerms(userId: number): Promise<void>;
  
  // Product methods
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(options?: { 
    category?: string; 
    condition?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    sellerId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined>;
  markProductAsSold(id: number): Promise<Product | undefined>;
  
  // Chat methods
  getChat(id: number): Promise<Chat | undefined>;
  getChatsByUser(userId: number): Promise<Chat[]>;
  getChatsByProduct(productId: number): Promise<Chat[]>;
  getChatBetweenUsers(productId: number, buyerId: number, sellerId: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: number, updates: UpdateChat): Promise<Chat | undefined>;
  
  // Message methods
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    if (DB_TYPE === 'postgres') {
      // Use PostgreSQL session store
      const PostgresStore = connectPgSimple(session);
      this.sessionStore = new PostgresStore({
        pool,
        tableName: 'session',
      });
    } else {
      // Use SQLite session store
      const SqliteStore = SQLiteStore(session);
      this.sessionStore = new SqliteStore({
        dir: dbDir,
        table: 'sessions'
      });
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async acceptTerms(userId: number): Promise<void> {
    await db.update(users)
      .set({ acceptedTerms: true })
      .where(eq(users.id, userId));
  }
  
  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id));
    return result[0];
  }
  
  async getProducts(options: { 
    category?: string; 
    condition?: string; 
    minPrice?: number; 
    maxPrice?: number; 
    sellerId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Product[]> {
    let query = db.select().from(products);
    
    // Apply filters
    const filters = [];
    
    if (options.category) {
      filters.push(eq(products.category, options.category));
    }
    
    if (options.condition) {
      filters.push(eq(products.condition, options.condition));
    }
    
    if (options.minPrice !== undefined) {
      filters.push(gte(products.price, options.minPrice));
    }
    
    if (options.maxPrice !== undefined) {
      filters.push(lte(products.price, options.maxPrice));
    }
    
    if (options.sellerId !== undefined) {
      filters.push(eq(products.sellerId, options.sellerId));
    }
    
    if (options.search) {
      filters.push(
        or(
          like(products.title, `%${options.search}%`),
          like(products.description, `%${options.search}%`)
        )
      );
    }
    
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    
    // Apply pagination
    if (options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    if (options.offset !== undefined) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }
  
  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    // For SQLite, we don't need special handling since Drizzle takes care of it
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }
  
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }
  
  async markProductAsSold(id: number): Promise<Product | undefined> {
    return this.updateProduct(id, { isSold: true });
  }
  
  // Chat methods
  async getChat(id: number): Promise<Chat | undefined> {
    const result = await db.select().from(chats).where(eq(chats.id, id));
    return result[0];
  }
  
  async getChatsByUser(userId: number): Promise<Chat[]> {
    return await db.select()
      .from(chats)
      .where(
        or(
          eq(chats.buyerId, userId),
          eq(chats.sellerId, userId)
        )
      );
  }
  
  async getChatsByProduct(productId: number): Promise<Chat[]> {
    return await db.select()
      .from(chats)
      .where(eq(chats.productId, productId));
  }
  
  async getChatBetweenUsers(productId: number, buyerId: number, sellerId: number): Promise<Chat | undefined> {
    const result = await db.select()
      .from(chats)
      .where(
        and(
          eq(chats.productId, productId),
          eq(chats.buyerId, buyerId),
          eq(chats.sellerId, sellerId)
        )
      );
    return result[0];
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const result = await db.insert(chats).values(insertChat).returning();
    return result[0];
  }
  
  async updateChat(id: number, updates: UpdateChat): Promise<Chat | undefined> {
    const result = await db.update(chats)
      .set(updates)
      .where(eq(chats.id, id))
      .returning();
    return result[0];
  }
  
  // Message methods
  async getMessages(chatId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
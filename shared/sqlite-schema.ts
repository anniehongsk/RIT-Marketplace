import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Use the same schema structure as in schema.ts but with SQLite types
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  acceptedTerms: integer("accepted_terms", { mode: "boolean" }).default(false),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  condition: text("condition").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  images: text("images", { mode: "json" }).notNull().$type<string[]>(),
  isSold: integer("is_sold", { mode: "boolean" }).default(false),
  allowCampusMeetup: integer("allow_campus_meetup", { mode: "boolean" }).default(true),
  allowDelivery: integer("allow_delivery", { mode: "boolean" }).default(false),
  allowPickup: integer("allow_pickup", { mode: "boolean" }).default(false),
  sellerId: integer("seller_id").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  orderType: text("order_type"),
  isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  text: text("text").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert Schemas - reuse the same as in schema.ts
import { insertUserSchema, insertProductSchema, insertChatSchema, insertMessageSchema, updateChatSchema } from "./schema";
export { insertUserSchema, insertProductSchema, insertChatSchema, insertMessageSchema, updateChatSchema };

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Chat = typeof chats.$inferSelect;
export type InsertChat = z.infer<typeof insertChatSchema>;
export type UpdateChat = z.infer<typeof updateChatSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Public User type (no password)
export type PublicUser = Omit<User, "password">;
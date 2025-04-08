import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  acceptedTerms: boolean("accepted_terms").default(false),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // stored in cents
  condition: text("condition").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  images: text("images").array().notNull(),
  isSold: boolean("is_sold").default(false),
  allowCampusMeetup: boolean("allow_campus_meetup").default(true),
  allowDelivery: boolean("allow_delivery").default(false),
  allowPickup: boolean("allow_pickup").default(false),
  sellerId: integer("seller_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  orderType: text("order_type"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  acceptedTerms: true,
});

export const insertProductSchema = createInsertSchema(products).omit({ 
  id: true,
  isSold: true,
  createdAt: true,
});

export const insertChatSchema = createInsertSchema(chats).omit({ 
  id: true,
  orderType: true, 
  isCompleted: true, 
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true,
});

export const updateChatSchema = z.object({
  orderType: z.enum(["campus", "delivery", "pickup"]).optional(),
  isCompleted: z.boolean().optional(),
});

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

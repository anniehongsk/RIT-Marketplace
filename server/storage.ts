import { users, products, chats, messages, type User, type InsertUser, type Product, type InsertProduct, type Chat, type InsertChat, type Message, type InsertMessage, type UpdateChat } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  
  currentUserId: number;
  currentProductId: number;
  currentChatId: number;
  currentMessageId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.chats = new Map();
    this.messages = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentChatId = 1;
    this.currentMessageId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async acceptTerms(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.acceptedTerms = true;
      this.users.set(userId, user);
    }
  }

  // Product methods
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
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
    let products = Array.from(this.products.values());
    
    if (options.sellerId !== undefined) {
      products = products.filter(product => product.sellerId === options.sellerId);
    }
    
    if (options.category) {
      products = products.filter(product => product.category === options.category);
    }
    
    if (options.condition) {
      products = products.filter(product => product.condition === options.condition);
    }
    
    if (options.minPrice !== undefined) {
      products = products.filter(product => product.price >= options.minPrice!);
    }
    
    if (options.maxPrice !== undefined) {
      products = products.filter(product => product.price <= options.maxPrice!);
    }
    
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      products = products.filter(product => 
        product.title.toLowerCase().includes(searchLower) || 
        product.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by newest first
    products.sort((a, b) => 
      new Date(b.createdAt || Date.now()).getTime() - 
      new Date(a.createdAt || Date.now()).getTime()
    );
    
    // Apply pagination if specified
    if (options.offset !== undefined && options.limit !== undefined) {
      products = products.slice(options.offset, options.offset + options.limit);
    } else if (options.limit !== undefined) {
      products = products.slice(0, options.limit);
    }
    
    return products;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = { 
      ...insertProduct, 
      id, 
      isSold: false, 
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async markProductAsSold(id: number): Promise<Product | undefined> {
    return this.updateProduct(id, { isSold: true });
  }

  // Chat methods
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getChatsByUser(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      chat => chat.buyerId === userId || chat.sellerId === userId
    );
  }

  async getChatsByProduct(productId: number): Promise<Chat[]> {
    return Array.from(this.chats.values()).filter(
      chat => chat.productId === productId
    );
  }

  async getChatBetweenUsers(productId: number, buyerId: number, sellerId: number): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(
      chat => chat.productId === productId && 
              chat.buyerId === buyerId && 
              chat.sellerId === sellerId
    );
  }

  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    const chat: Chat = { 
      ...insertChat, 
      id, 
      orderType: null, 
      isCompleted: false, 
      createdAt: new Date() 
    };
    this.chats.set(id, chat);
    return chat;
  }

  async updateChat(id: number, updates: UpdateChat): Promise<Chat | undefined> {
    const chat = await this.getChat(id);
    if (!chat) return undefined;
    
    const updatedChat = { ...chat, ...updates };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }

  // Message methods
  async getMessages(chatId: number): Promise<Message[]> {
    const messages = Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => 
        new Date(a.createdAt || Date.now()).getTime() - 
        new Date(b.createdAt || Date.now()).getTime()
      );
    
    return messages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();

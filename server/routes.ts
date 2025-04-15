import express, { type Express, type Request } from "express";
import { createServer, type Server } from "http";
import { storage as dataStorage } from "./storage";
import { setupAuth } from "./auth";
import { setupWebsocket } from "./websocket";
import { z } from "zod";
import { insertProductSchema, updateChatSchema, insertChatSchema, insertMessageSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Configure multer for handling file uploads
  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      // Create a unique filename with original extension
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  });
  
  // File filter to only accept image files
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };
  
  const upload = multer({ 
    storage: diskStorage, 
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max file size
    }
  });
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // File upload endpoint
  app.post("/api/upload", upload.array('images', 5), (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Return array of file URLs
      const fileUrls = files.map(file => `/uploads/${file.filename}`);
      return res.status(200).json({ urls: fileUrls });
    } catch (error) {
      console.error("Upload error:", error);
      return res.status(500).json({ message: "Failed to upload files" });
    }
  });
  
  // API routes
  // Accept terms and conditions
  app.post("/api/terms/accept", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      await dataStorage.acceptTerms(req.user.id);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Failed to accept terms" });
    }
  });
  
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, condition, minPrice, maxPrice, search, limit, offset } = req.query;
      
      const options: any = {};
      if (category) options.category = category as string;
      if (condition) options.condition = condition as string;
      if (minPrice) options.minPrice = parseInt(minPrice as string);
      if (maxPrice) options.maxPrice = parseInt(maxPrice as string);
      if (search) options.search = search as string;
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      
      const products = await storage.getProducts(options);
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  });
  
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      return res.status(200).json(product);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch product" });
    }
  });
  
  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertProductSchema.parse(req.body);
      
      // Ensure the seller is the current user
      validatedData.sellerId = req.user.id;
      
      const product = await storage.createProduct(validatedData);
      return res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to create product" });
    }
  });
  
  app.get("/api/my-listings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const products = await storage.getProducts({ sellerId: req.user.id });
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch listings" });
    }
  });
  
  // Chats
  app.get("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const chats = await storage.getChatsByUser(req.user.id);
      return res.status(200).json(chats);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch chats" });
    }
  });
  
  app.post("/api/chats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const validatedData = insertChatSchema.parse(req.body);
      
      // Check if product exists
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if chat already exists between users for this product
      const existingChat = await storage.getChatBetweenUsers(
        validatedData.productId, 
        validatedData.buyerId, 
        validatedData.sellerId
      );
      
      if (existingChat) {
        return res.status(200).json(existingChat);
      }
      
      // Ensure the buyer is the current user if not the seller
      if (validatedData.sellerId !== req.user.id && validatedData.buyerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const chat = await storage.createChat(validatedData);
      return res.status(201).json(chat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid chat data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to create chat" });
    }
  });
  
  app.patch("/api/chats/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Only seller can mark as completed or update order type
      if (chat.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = updateChatSchema.parse(req.body);
      const updatedChat = await storage.updateChat(chatId, validatedData);
      
      // If the chat is marked as completed, mark the product as sold
      if (validatedData.isCompleted) {
        await storage.markProductAsSold(chat.productId);
      }
      
      return res.status(200).json(updatedChat);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to update chat" });
    }
  });
  
  app.get("/api/chats/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Only participants can view messages
      if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const messages = await storage.getMessages(chatId);
      return res.status(200).json(messages);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.post("/api/chats/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const chatId = parseInt(req.params.id);
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Only participants can send messages
      if (chat.buyerId !== req.user.id && chat.sellerId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Don't allow messages in completed chats
      if (chat.isCompleted) {
        return res.status(400).json({ message: "Chat is completed" });
      }
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        chatId,
        senderId: req.user.id,
      });
      
      const message = await storage.createMessage(validatedData);
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.format() });
      }
      return res.status(500).json({ message: "Failed to create message" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket Server for real-time chat
  setupWebsocket(httpServer);

  return httpServer;
}

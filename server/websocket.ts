import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

interface ChatMessage {
  type: 'message';
  chatId: number;
  message: {
    id: number;
    chatId: number;
    senderId: number;
    text: string;
    createdAt: Date;
  }
}

interface ChatUpdate {
  type: 'chat_update';
  chat: {
    id: number;
    orderType: string | null;
    isCompleted: boolean;
  }
}

interface ProductSold {
  type: 'product_sold';
  productId: number;
}

type WebSocketMessage = ChatMessage | ChatUpdate | ProductSold;

// Map to store active connections by user ID
const connections = new Map<number, WebSocket[]>();

export function setupWebsocket(server: Server): void {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let userId: number | null = null;

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        // Handle authentication messages
        if (data.type === 'auth') {
          userId = data.userId;
          
          // Store connection in the map
          if (!connections.has(userId)) {
            connections.set(userId, []);
          }
          connections.get(userId)!.push(ws);
          
          ws.send(JSON.stringify({ type: 'auth_success' }));
          return;
        }

        // Ensure authenticated for other messages
        if (!userId) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Authentication required' 
          }));
          return;
        }

        // Handle new message
        if (data.type === 'new_message' && data.chatId && data.text) {
          const chatId = parseInt(data.chatId);
          const chat = await storage.getChat(chatId);
          
          if (!chat) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Chat not found' 
            }));
            return;
          }

          // Check if user is part of this chat
          if (chat.buyerId !== userId && chat.sellerId !== userId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Not authorized for this chat' 
            }));
            return;
          }

          // Don't allow messages in completed chats
          if (chat.isCompleted) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Chat is completed' 
            }));
            return;
          }

          // Create the message
          const message = await storage.createMessage({
            chatId,
            senderId: userId,
            text: data.text
          });

          // Send message to all participants of the chat
          const recipientId = userId === chat.buyerId ? chat.sellerId : chat.buyerId;
          
          const messageData: ChatMessage = {
            type: 'message',
            chatId,
            message
          };
          
          // Send to recipient
          sendToUser(recipientId, messageData);
          
          // Send confirmation back to sender
          ws.send(JSON.stringify(messageData));
        }
        
        // Handle chat updates
        if (data.type === 'update_chat' && data.chatId) {
          const chatId = parseInt(data.chatId);
          const chat = await storage.getChat(chatId);
          
          if (!chat) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Chat not found' 
            }));
            return;
          }

          // Only seller can update chat
          if (chat.sellerId !== userId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Only seller can update chat' 
            }));
            return;
          }

          const updates: any = {};
          if (data.orderType) {
            updates.orderType = data.orderType;
          }
          
          if (data.isCompleted !== undefined) {
            updates.isCompleted = data.isCompleted;
          }

          const updatedChat = await storage.updateChat(chatId, updates);
          
          if (!updatedChat) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Failed to update chat' 
            }));
            return;
          }

          // If chat is marked as completed, mark product as sold
          if (updates.isCompleted) {
            const soldProduct = await storage.markProductAsSold(chat.productId);
            
            if (soldProduct) {
              // Notify all users of sold product
              broadcastMessage({
                type: 'product_sold',
                productId: soldProduct.id
              });
            }
          }

          // Send update to buyer
          const chatUpdate: ChatUpdate = {
            type: 'chat_update',
            chat: {
              id: updatedChat.id,
              orderType: updatedChat.orderType,
              isCompleted: updatedChat.isCompleted
            }
          };
          
          sendToUser(chat.buyerId, chatUpdate);
          
          // Send confirmation back to seller
          ws.send(JSON.stringify(chatUpdate));
        }

      } catch (error) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    ws.on('close', () => {
      if (userId) {
        // Remove this connection from the user's connections
        const userConnections = connections.get(userId);
        if (userConnections) {
          const index = userConnections.indexOf(ws);
          if (index !== -1) {
            userConnections.splice(index, 1);
          }
          
          // Clean up if no more connections for this user
          if (userConnections.length === 0) {
            connections.delete(userId);
          }
        }
      }
    });
  });
}

function sendToUser(userId: number, data: WebSocketMessage): void {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(data));
      }
    });
  }
}

function broadcastMessage(data: WebSocketMessage): void {
  connections.forEach(userConnections => {
    userConnections.forEach(connection => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send(JSON.stringify(data));
      }
    });
  });
}

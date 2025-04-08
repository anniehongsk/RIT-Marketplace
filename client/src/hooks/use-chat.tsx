import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { Chat, Message } from "@shared/schema";

interface ChatContextType {
  messages: Record<number, Message[]>;
  sendMessage: (chatId: number, text: string) => void;
  updateChatStatus: (chatId: number, isCompleted: boolean) => void;
  updateOrderType: (chatId: number, orderType: string) => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Record<number, Message[]>>({});

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log("WebSocket connected");
      // Authenticate with the WebSocket server
      newSocket.send(JSON.stringify({ 
        type: 'auth', 
        userId: user.id 
      }));
    };
    
    newSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'auth_success') {
        setIsConnected(true);
      } 
      else if (data.type === 'message') {
        const { chatId, message } = data;
        setMessages(prev => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), message]
        }));
      } 
      else if (data.type === 'chat_update') {
        // Handle chat status updates (order type, completion)
        if (data.chat.isCompleted) {
          toast({
            title: "Transaction completed",
            description: "The seller has marked this transaction as complete.",
          });
        }
      } 
      else if (data.type === 'error') {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    };
    
    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };
    
    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection error",
        description: "Failed to connect to the chat server. Please try again later.",
        variant: "destructive"
      });
    };
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [user, toast]);

  // Send a message via WebSocket
  const sendMessage = useCallback((chatId: number, text: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !isConnected) {
      toast({
        title: "Cannot send message",
        description: "You are not connected to the chat server.",
        variant: "destructive"
      });
      return;
    }
    
    socket.send(JSON.stringify({
      type: 'new_message',
      chatId,
      text
    }));
  }, [socket, isConnected, toast]);

  // Update chat completion status (mark transaction as complete)
  const updateChatStatus = useCallback((chatId: number, isCompleted: boolean) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !isConnected) {
      toast({
        title: "Cannot update chat",
        description: "You are not connected to the chat server.",
        variant: "destructive"
      });
      return;
    }
    
    socket.send(JSON.stringify({
      type: 'update_chat',
      chatId,
      isCompleted
    }));
  }, [socket, isConnected, toast]);

  // Update order type
  const updateOrderType = useCallback((chatId: number, orderType: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !isConnected) {
      toast({
        title: "Cannot update order type",
        description: "You are not connected to the chat server.",
        variant: "destructive"
      });
      return;
    }
    
    socket.send(JSON.stringify({
      type: 'update_chat',
      chatId,
      orderType
    }));
  }, [socket, isConnected, toast]);

  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage, 
      updateChatStatus, 
      updateOrderType,
      isConnected
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

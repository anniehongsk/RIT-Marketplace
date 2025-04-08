import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useChat } from "@/hooks/use-chat";
import { Chat, Message, Product, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Check } from "lucide-react";
import { formatDistance } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ChatInterfaceProps {
  chat: Chat;
  product: Product;
  seller: User;
}

export default function ChatInterface({ chat, product, seller }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages: wsMessages, sendMessage, updateChatStatus, updateOrderType, isConnected } = useChat();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSeller = user?.id === seller.id;
  
  // Fetch messages from API
  const { data: apiMessages = [], isLoading } = useQuery<Message[]>({
    queryKey: [`/api/chats/${chat.id}/messages`],
    enabled: !!chat,
  });

  // Combine API messages with WebSocket messages
  const allMessages = [...apiMessages, ...(wsMessages[chat.id] || [])];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isConnected) return;
    
    sendMessage(chat.id, inputMessage.trim());
    setInputMessage("");
  };

  const handleConfirmTransaction = () => {
    if (!isConnected) {
      toast({
        title: "Connection error",
        description: "You're not connected to the chat server. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    updateChatStatus(chat.id, true);
    toast({
      title: "Transaction confirmed",
      description: "The item has been marked as sold.",
    });
  };

  const handleSelectOrderType = (orderType: string) => {
    if (!isConnected) {
      toast({
        title: "Connection error",
        description: "You're not connected to the chat server. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    
    updateOrderType(chat.id, orderType);
    toast({
      title: "Order type updated",
      description: `Order type set to ${orderType}.`,
    });
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return <div className="p-4">Loading messages...</div>;
  }

  return (
    <>
      {/* Chat Messages */}
      <div className="h-80 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No messages yet. Start the conversation!
          </div>
        ) : (
          allMessages.map((message) => {
            const isSentByMe = message.senderId === user?.id;
            return (
              <div 
                key={message.id} 
                className={`flex items-end ${isSentByMe ? 'justify-end' : ''}`}
              >
                {!isSentByMe && (
                  <div className="w-8 h-8 rounded-full bg-[#F76902] text-white flex items-center justify-center text-sm font-bold mr-2">
                    {seller.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div 
                  className={`max-w-xs p-3 rounded-lg ${
                    isSentByMe 
                      ? 'bg-[#F76902] text-white rounded-bl-lg rounded-br-sm rounded-tr-lg rounded-tl-lg' 
                      : 'bg-gray-200 rounded-bl-sm rounded-br-lg rounded-tr-lg rounded-tl-lg'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className={`text-xs ${isSentByMe ? 'text-white/80' : 'text-gray-500'} mt-1 block`}>
                    {formatTime(message.createdAt || new Date())}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Order Type Selection (For Buyer) */}
      {!isSeller && !chat.isCompleted && (
        <div className="p-3 bg-gray-100 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Select order type:</p>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={chat.orderType === "campus" ? "bg-[#F76902] text-white" : ""}
              onClick={() => handleSelectOrderType("campus")}
            >
              Campus Meetup
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={chat.orderType === "delivery" ? "bg-[#F76902] text-white" : ""}
              onClick={() => handleSelectOrderType("delivery")}
              disabled={!product.allowDelivery}
            >
              Delivery
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={chat.orderType === "pickup" ? "bg-[#F76902] text-white" : ""}
              onClick={() => handleSelectOrderType("pickup")}
              disabled={!product.allowPickup}
            >
              Pickup
            </Button>
          </div>
        </div>
      )}
      
      {/* Transaction Confirmation (For Seller) */}
      {isSeller && !chat.isCompleted && chat.orderType && (
        <div className="p-3 bg-gray-100 border-t border-gray-200">
          <Button 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleConfirmTransaction}
          >
            <Check className="mr-2 h-4 w-4" /> Confirm Transaction Complete
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">Click when you've received payment and delivered the item</p>
        </div>
      )}
      
      {/* Transaction Completed Message */}
      {chat.isCompleted && (
        <div className="p-3 bg-green-100 border-t border-gray-200 text-green-800 text-center">
          <p className="font-medium">Transaction completed</p>
          <p className="text-xs">This chat is now closed</p>
        </div>
      )}
      
      {/* Chat Input */}
      {!chat.isCompleted && (
        <div className="p-3 border-t border-gray-200">
          <form onSubmit={handleSendMessage}>
            <div className="relative">
              <Input
                type="text"
                placeholder="Type a message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={!isConnected}
                className="pr-10 py-2 px-3 rounded-full"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={!inputMessage.trim() || !isConnected}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-[#F76902] h-8 w-8"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

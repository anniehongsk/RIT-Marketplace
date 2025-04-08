import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Chat, Product, Message, User } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import MobileNavbar from "@/components/layout/mobile-navbar";
import ChatInterface from "@/components/chat-interface";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MessageSquare, 
  ShoppingCart, 
  Tag,
  User as UserIcon,
  Clock,
  ArrowRight,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { ChatProvider } from "@/hooks/use-chat";

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  
  // Fetch all chats for current user
  const { data: chats, isLoading: isLoadingChats } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user,
  });
  
  // Separate buying and selling chats
  const buyingChats = chats?.filter(chat => chat.buyerId === user?.id) || [];
  const sellingChats = chats?.filter(chat => chat.sellerId === user?.id) || [];
  
  // Get product details for the selected chat
  const { data: product } = useQuery<Product>({
    queryKey: [`/api/products/${selectedChat?.productId}`],
    enabled: !!selectedChat?.productId,
  });
  
  // Get chat partner details
  const { data: partner } = useQuery<User>({
    queryKey: [`/api/user/${selectedChat?.buyerId === user?.id ? selectedChat?.sellerId : selectedChat?.buyerId}`],
    enabled: !!selectedChat && (selectedChat.buyerId === user?.id || selectedChat.sellerId === user?.id),
  });
  
  // Set product and partner when they load
  useEffect(() => {
    if (product) {
      setSelectedProduct(product);
    }
    
    if (partner) {
      setChatPartner(partner);
    }
  }, [product, partner]);
  
  // Filter chats based on search query
  const filterChats = (chatList: Chat[]) => {
    if (!searchQuery.trim()) return chatList;
    
    // This is a basic filter - in a real app we'd have product names indexed
    return chatList.filter(chat => {
      const matchesProductId = chat.productId.toString().includes(searchQuery);
      const matchesUser = chat.buyerId.toString().includes(searchQuery) || 
                          chat.sellerId.toString().includes(searchQuery);
      return matchesProductId || matchesUser;
    });
  };
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "just now";
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };
  
  return (
    <ChatProvider>
      <div>
        <Navbar />
        
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-[#513127] mb-6">Messages</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Chat List */}
            <div className="lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                  <div className="relative mt-2">
                    <Input 
                      placeholder="Search conversations..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  </div>
                </CardHeader>
                
                <Tabs defaultValue="buying" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buying" className="flex items-center justify-center">
                      <ShoppingCart className="mr-2 h-4 w-4" /> Buying
                    </TabsTrigger>
                    <TabsTrigger value="selling" className="flex items-center justify-center">
                      <Tag className="mr-2 h-4 w-4" /> Selling
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="buying">
                    {isLoadingChats ? (
                      <CardContent>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="py-2">
                            <div className="flex items-center space-x-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    ) : (
                      <CardContent className="p-0">
                        {filterChats(buyingChats).length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No buying chats</h3>
                            <p className="text-gray-500 mb-4">You haven't contacted any sellers yet.</p>
                            <Button 
                              className="bg-[#F76902] hover:bg-[#E15900]"
                              onClick={() => window.location.href = "/"}
                            >
                              Browse Listings
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filterChats(buyingChats).map(chat => (
                              <div 
                                key={chat.id} 
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${selectedChat?.id === chat.id ? 'bg-gray-50' : ''}`}
                                onClick={() => setSelectedChat(chat)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-[#F76902] text-white flex items-center justify-center text-sm font-bold">
                                    S{chat.sellerId}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        Product #{chat.productId}
                                      </h4>
                                      <span className="text-xs text-gray-500">{formatDate(chat.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                                      <UserIcon className="inline h-3 w-3 mr-1" /> Seller #{chat.sellerId}
                                    </p>
                                    {chat.isCompleted && (
                                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 rounded px-2 py-0.5">
                                        Completed
                                      </span>
                                    )}
                                    {chat.orderType && (
                                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 rounded px-2 py-0.5 ml-1">
                                        {chat.orderType.charAt(0).toUpperCase() + chat.orderType.slice(1)}
                                      </span>
                                    )}
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="selling">
                    {isLoadingChats ? (
                      <CardContent>
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="py-2">
                            <div className="flex items-center space-x-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-36" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    ) : (
                      <CardContent className="p-0">
                        {filterChats(sellingChats).length === 0 ? (
                          <div className="flex flex-col items-center justify-center p-6 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No selling chats</h3>
                            <p className="text-gray-500 mb-4">You haven't received any buyer messages yet.</p>
                            <Button 
                              className="bg-[#F76902] hover:bg-[#E15900]"
                              onClick={() => window.location.href = "/my-listings"}
                            >
                              View My Listings
                            </Button>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filterChats(sellingChats).map(chat => (
                              <div 
                                key={chat.id} 
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition ${selectedChat?.id === chat.id ? 'bg-gray-50' : ''}`}
                                onClick={() => setSelectedChat(chat)}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-sm font-bold">
                                    B{chat.buyerId}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        Product #{chat.productId}
                                      </h4>
                                      <span className="text-xs text-gray-500">{formatDate(chat.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                                      <UserIcon className="inline h-3 w-3 mr-1" /> Buyer #{chat.buyerId}
                                    </p>
                                    {chat.isCompleted && (
                                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-800 rounded px-2 py-0.5">
                                        Completed
                                      </span>
                                    )}
                                    {chat.orderType && (
                                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-800 rounded px-2 py-0.5 ml-1">
                                        {chat.orderType.charAt(0).toUpperCase() + chat.orderType.slice(1)}
                                      </span>
                                    )}
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
            
            {/* Right Column - Chat Window */}
            <div className="lg:col-span-8">
              <Card className="h-full">
                {selectedChat && selectedProduct && chatPartner ? (
                  <>
                    <CardHeader className="border-b border-gray-200 pb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#F76902] text-white flex items-center justify-center text-sm font-bold mr-3">
                          {chatPartner.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{selectedProduct.title}</CardTitle>
                          <CardDescription>
                            Chat with {chatPartner.username} • {formatDate(selectedChat.createdAt)}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <ChatInterface
                      chat={selectedChat}
                      product={selectedProduct}
                      seller={{ id: selectedProduct.sellerId, username: chatPartner.username } as User}
                    />
                  </>
                ) : (
                  <CardContent className="flex flex-col items-center justify-center h-96 text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-medium text-gray-700 mb-2">No chat selected</h3>
                    <p className="text-gray-500 max-w-md">
                      Select a conversation from the list to view messages or browse listings to start a new conversation.
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
        
        <MobileNavbar />
      </div>
    </ChatProvider>
  );
}

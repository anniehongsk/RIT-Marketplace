import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Product, Chat, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MapPin, User as UserIcon, Clock, ArrowLeft } from "lucide-react";
import { formatDistance } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "./chat-interface";

interface ProductDetailsSidebarProps {
  product?: Product;
  seller?: User;
}

export default function ProductDetailsSidebar({ product, seller }: ProductDetailsSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showChat, setShowChat] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);

  const formatConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "like new":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-yellow-100 text-yellow-800";
      case "fair":
        return "bg-orange-100 text-orange-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "just now";
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };

  // Fetch existing chat if any
  const { data: chats } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: !!user && !!product,
  });

  useEffect(() => {
    if (chats && product && user) {
      const existingChat = chats.find(c => 
        c.productId === product.id && 
        (c.buyerId === user.id || c.sellerId === user.id)
      );
      
      if (existingChat) {
        setChat(existingChat);
      }
    }
  }, [chats, product, user]);

  const handleContactSeller = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to contact the seller.",
        variant: "destructive"
      });
      return;
    }

    if (!product || !seller) {
      toast({
        title: "Error",
        description: "Product information is missing.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if chat already exists
      if (chat) {
        setShowChat(true);
        return;
      }

      // Create new chat
      const res = await apiRequest("POST", "/api/chats", {
        productId: product.id,
        buyerId: user.id,
        sellerId: product.sellerId
      });

      const newChat = await res.json();
      setChat(newChat);
      setShowChat(true);
      
      // Invalidate chats query to refresh the chat list
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate chat with seller.",
        variant: "destructive"
      });
    }
  };

  if (!product || !seller) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden p-4">
        <p className="text-gray-500 text-center">Select a product to view details</p>
      </div>
    );
  }

  const defaultImage = "https://via.placeholder.com/300x200?text=No+Image";
  const productImage = product.images && product.images.length > 0 ? product.images[0] : defaultImage;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Product Preview Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-bold text-lg text-[#513127]">Item Details</h2>
      </div>
      
      {showChat && chat ? (
        <div>
          <div className="bg-gray-100 p-4 flex items-center border-b border-gray-200">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowChat(false)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{product.title}</h3>
              <p className="text-xs text-gray-500">Chat with {seller.username}</p>
            </div>
          </div>

          <ChatInterface 
            chat={chat} 
            product={product} 
            seller={seller} 
          />
        </div>
      ) : (
        <div className="p-4">
          <img 
            src={productImage} 
            alt={product.title} 
            className="w-full h-48 object-cover rounded mb-4"
          />
          
          <h3 className="font-semibold text-gray-800 text-lg mb-1">{product.title}</h3>
          <div className="flex items-center mb-3">
            <span className={`${formatConditionColor(product.condition)} text-xs px-2 py-1 rounded mr-2`}>
              {product.condition}
            </span>
            <span className="font-bold text-[#513127]">{formatPrice(product.price)}</span>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{product.description}</p>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <UserIcon className="text-gray-500 mr-2 h-4 w-4" />
              <span className="text-sm text-gray-700">Sold by: <span className="font-medium">{seller.username}</span></span>
            </div>
            <div className="flex items-center mb-2">
              <MapPin className="text-gray-500 mr-2 h-4 w-4" />
              <span className="text-sm text-gray-700">Location: <span className="font-medium">{product.location}</span></span>
            </div>
            <div className="flex items-center">
              <Clock className="text-gray-500 mr-2 h-4 w-4" />
              <span className="text-sm text-gray-700">Posted: <span className="font-medium">{formatDate(product.createdAt)}</span></span>
            </div>
          </div>
          
          <Button 
            className="w-full bg-[#F76902] hover:bg-[#E15900] text-white"
            onClick={handleContactSeller}
            disabled={product.isSold || product.sellerId === user?.id}
          >
            {product.isSold ? "Item Sold" : (product.sellerId === user?.id ? "Your Item" : "Contact Seller")}
          </Button>
        </div>
      )}
    </div>
  );
}

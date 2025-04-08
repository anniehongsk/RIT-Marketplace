import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Product } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import MobileNavbar from "@/components/layout/mobile-navbar";
import SellItemModal from "@/components/sell-item-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Tag, ShoppingBag, Package } from "lucide-react";
import { formatDistance } from "date-fns";
import { Link } from "wouter";
import { ChatProvider } from "@/hooks/use-chat";

export default function MyListingsPage() {
  const { user } = useAuth();
  const [showSellModal, setShowSellModal] = useState(false);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/my-listings"],
    enabled: !!user,
  });
  
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };
  
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "just now";
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  };
  
  // Filter products by status
  const activeListings = products?.filter(product => !product.isSold) || [];
  const soldListings = products?.filter(product => product.isSold) || [];

  return (
    <ChatProvider>
      <div>
        <Navbar />
        
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[#513127]">My Listings</h1>
            <Button 
              className="bg-[#F76902] hover:bg-[#E15900]"
              onClick={() => setShowSellModal(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> List New Item
            </Button>
          </div>
          
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 max-w-md">
              <TabsTrigger value="active" className="flex items-center">
                <Tag className="mr-2 h-4 w-4" /> Active ({activeListings.length})
              </TabsTrigger>
              <TabsTrigger value="sold" className="flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" /> Sold ({soldListings.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-0">
                        <Skeleton className="h-48 w-full rounded-t-lg" />
                        <div className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {activeListings.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <Package className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No active listings</h3>
                        <p className="text-gray-500 mb-4">You don't have any active listings at the moment.</p>
                        <Button 
                          className="bg-[#F76902] hover:bg-[#E15900]"
                          onClick={() => setShowSellModal(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" /> List an Item
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeListings.map((product) => {
                        const defaultImage = "https://via.placeholder.com/300x200?text=No+Image";
                        const productImage = product.images && product.images.length > 0 ? product.images[0] : defaultImage;
                        
                        return (
                          <Link key={product.id} href={`/product/${product.id}`}>
                            <a className="block">
                              <Card className="cursor-pointer hover:shadow-md transition">
                                <CardContent className="p-0">
                                  <img
                                    src={productImage}
                                    alt={product.title}
                                    className="h-48 w-full object-cover rounded-t-lg"
                                  />
                                  <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.title}</h3>
                                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-lg text-[#513127]">{formatPrice(product.price)}</span>
                                      <span className="text-xs text-gray-500">Posted {formatDate(product.createdAt)}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </a>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="sold">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-0">
                        <Skeleton className="h-48 w-full rounded-t-lg" />
                        <div className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-6 w-16" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <>
                  {soldListings.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No sold items</h3>
                        <p className="text-gray-500">You haven't sold any items yet.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {soldListings.map((product) => {
                        const defaultImage = "https://via.placeholder.com/300x200?text=No+Image";
                        const productImage = product.images && product.images.length > 0 ? product.images[0] : defaultImage;
                        
                        return (
                          <Link key={product.id} href={`/product/${product.id}`}>
                            <a className="block">
                              <Card className="cursor-pointer hover:shadow-md transition">
                                <CardContent className="p-0">
                                  <div className="relative">
                                    <img
                                      src={productImage}
                                      alt={product.title}
                                      className="h-48 w-full object-cover rounded-t-lg opacity-75"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">SOLD</span>
                                    </div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.title}</h3>
                                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-lg text-[#513127]">{formatPrice(product.price)}</span>
                                      <span className="text-xs text-gray-500">Sold {formatDate(product.createdAt)}</span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </a>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
          
          <SellItemModal open={showSellModal} onClose={() => setShowSellModal(false)} />
        </div>
        
        <MobileNavbar />
      </div>
    </ChatProvider>
  );
}

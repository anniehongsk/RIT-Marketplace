import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product, User } from "@shared/schema";
import Navbar from "@/components/layout/navbar";
import MobileNavbar from "@/components/layout/mobile-navbar";
import ProductDetailsSidebar from "@/components/product-details-sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, User as UserIcon, Clock } from "lucide-react";
import { formatDistance } from "date-fns";
import { ChatProvider } from "@/hooks/use-chat";

export default function ProductDetailsPage() {
  const [_, params] = useRoute("/product/:id");
  const [, navigate] = useLocation();
  const productId = params?.id ? parseInt(params.id) : null;

  const { data: product, isLoading: isLoadingProduct, error: productError } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  const { data: seller, isLoading: isLoadingSeller } = useQuery<User>({
    queryKey: [`/api/user/${product?.sellerId}`],
    enabled: !!product?.sellerId,
  });

  // Default image if no images are provided
  const defaultImage = "https://via.placeholder.com/800x500?text=No+Image";
  const productMainImage = product?.images && product.images.length > 0 ? product.images[0] : defaultImage;
  const productGalleryImages = product?.images?.slice(1) || [];

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

  return (
    <ChatProvider>
      <div>
        <Navbar />
        
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            className="mb-4 flex items-center"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Button>
          
          {productError ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <h2 className="text-xl font-bold text-red-500 mb-2">Error</h2>
              <p>We couldn't find the product you're looking for.</p>
              <Button
                className="mt-4 bg-[#F76902] hover:bg-[#E15900]"
                onClick={() => navigate("/")}
              >
                Return to Homepage
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Product Content */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-lg shadow p-4">
                  {isLoadingProduct ? (
                    <div className="space-y-4">
                      <Skeleton className="h-[400px] w-full rounded-lg" />
                      <Skeleton className="h-10 w-3/4" />
                      <Skeleton className="h-6 w-1/4" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Main Image */}
                      <div className="mb-4">
                        <img
                          src={productMainImage}
                          alt={product?.title}
                          className="w-full h-[400px] object-cover rounded-lg"
                        />
                      </div>
                      
                      {/* Thumbnail Gallery */}
                      {productGalleryImages.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto mb-4">
                          {productGalleryImages.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`${product?.title} view ${index + 2}`}
                              className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Product Info */}
                      <div className="mb-4">
                        <h1 className="text-2xl font-bold text-[#513127] mb-2">{product?.title}</h1>
                        <div className="flex items-center mb-3">
                          <span className={`${formatConditionColor(product?.condition || "")} text-xs px-2 py-1 rounded mr-2`}>
                            {product?.condition}
                          </span>
                          <span className="font-bold text-xl text-[#513127]">
                            {formatPrice(product?.price || 0)}
                          </span>
                          
                          {product?.isSold && (
                            <span className="ml-4 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                              SOLD
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Product Details */}
                      <div className="mb-6">
                        <h2 className="font-semibold text-lg text-[#513127] mb-2">Description</h2>
                        <p className="text-gray-700 whitespace-pre-line">{product?.description}</p>
                      </div>
                      
                      {/* Seller and Location Info */}
                      <div className="border-t border-gray-200 pt-4">
                        <h2 className="font-semibold text-lg text-[#513127] mb-2">Item Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center mb-2">
                              <UserIcon className="text-gray-500 mr-2 h-4 w-4" />
                              <span className="text-sm text-gray-700">
                                Seller: <span className="font-medium">{seller?.username || "Loading..."}</span>
                              </span>
                            </div>
                            <div className="flex items-center mb-2">
                              <MapPin className="text-gray-500 mr-2 h-4 w-4" />
                              <span className="text-sm text-gray-700">
                                Location: <span className="font-medium">{product?.location}</span>
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="text-gray-500 mr-2 h-4 w-4" />
                              <span className="text-sm text-gray-700">
                                Posted: <span className="font-medium">{formatDate(product?.createdAt)}</span>
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Delivery Options:</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {product?.allowCampusMeetup && (
                                <li className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Campus Meetup
                                </li>
                              )}
                              {product?.allowDelivery && (
                                <li className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Delivery
                                </li>
                              )}
                              {product?.allowPickup && (
                                <li className="flex items-center">
                                  <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Pickup
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Right Sidebar */}
              <div className="lg:col-span-4">
                <ProductDetailsSidebar product={product} seller={seller} />
              </div>
            </div>
          )}
        </div>
        
        <MobileNavbar />
      </div>
    </ChatProvider>
  );
}

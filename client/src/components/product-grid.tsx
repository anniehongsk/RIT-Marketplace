import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "./product-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@shared/schema";

interface ProductGridProps {
  category?: string;
  condition?: string[];
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
}

export default function ProductGrid({
  category,
  condition,
  minPrice,
  maxPrice,
  searchQuery
}: ProductGridProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("newest");
  
  // Build query string from filters
  const buildQueryString = () => {
    const params = new URLSearchParams();
    
    if (category) params.append("category", category);
    if (condition && condition.length > 0) {
      condition.forEach(c => params.append("condition", c));
    }
    if (minPrice !== undefined) params.append("minPrice", minPrice.toString());
    if (maxPrice !== undefined) params.append("maxPrice", maxPrice.toString());
    if (searchQuery) params.append("search", searchQuery);
    
    return params.toString();
  };
  
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products", buildQueryString()],
    keepPreviousData: true,
  });
  
  // Sort products based on selected sort option
  const sortedProducts = products ? [...products].sort((a, b) => {
    switch (sort) {
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      default:
        return 0;
    }
  }) : [];
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#513127]">
          {category ? category : searchQuery ? `Search results for "${searchQuery}"` : "Featured Items"}
        </h1>
        <div className="hidden md:flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "grid" ? "text-[#F76902]" : "text-gray-500"}
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={viewMode === "list" ? "text-[#F76902]" : "text-gray-500"}
            onClick={() => setViewMode("list")}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center space-x-2 mb-2 md:mb-0">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] text-sm border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Mobile filters button - would connect to a filters modal */}
        <Button variant="outline" size="sm" className="md:hidden flex items-center text-sm">
          <span className="mr-1">Filters</span>
        </Button>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4">
                <Skeleton className="h-6 w-4/5 mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load products. Please try again later.</p>
        </div>
      )}
      
      {/* Empty state */}
      {!isLoading && sortedProducts && sortedProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}
      
      {/* Product Grid */}
      {!isLoading && sortedProducts && sortedProducts.length > 0 && (
        <div className={`grid grid-cols-1 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""} gap-4`}>
          {sortedProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!isLoading && sortedProducts && sortedProducts.length > 0 && (
        <div className="flex justify-center mt-8">
          <nav className="inline-flex rounded-md shadow">
            <Button variant="outline" size="sm" disabled className="rounded-l-md rounded-r-none">
              Previous
            </Button>
            <Button variant="outline" size="sm" className="rounded-none border-x-0 bg-white text-[#F76902]">
              1
            </Button>
            <Button variant="outline" size="sm" className="rounded-none">
              2
            </Button>
            <Button variant="outline" size="sm" className="rounded-none">
              3
            </Button>
            <Button variant="outline" size="sm" className="rounded-r-md rounded-l-none">
              Next
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import MobileNavbar from "@/components/layout/mobile-navbar";
import CategoriesSidebar from "@/components/categories-sidebar";
import ProductGrid from "@/components/product-grid";
import TermsModal from "@/components/terms-modal";
import SellItemModal from "@/components/sell-item-modal";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ChatProvider } from "@/hooks/use-chat";

export default function HomePage() {
  const { user } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min?: number, max?: number }>({});
  const [searchQuery, setSearchQuery] = useState<string | undefined>(undefined);
  
  useEffect(() => {
    // Show terms modal if user hasn't accepted terms
    if (user && !user.acceptedTerms) {
      setShowTerms(true);
    }
  }, [user]);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };
  
  const handleConditionChange = (conditions: string[]) => {
    setSelectedConditions(conditions);
  };
  
  const handlePriceRangeChange = (min?: number, max?: number) => {
    setPriceRange({ min, max });
  };
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  return (
    <ChatProvider>
      <div>
        <Navbar onSearch={handleSearch} />
        
        <div className="container mx-auto px-4 py-6">
          {/* Main Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Sidebar (Categories) - Desktop only */}
            <div className="hidden md:block md:col-span-3 lg:col-span-2">
              <CategoriesSidebar 
                onCategoryChange={handleCategoryChange}
                onConditionChange={handleConditionChange}
                onPriceRangeChange={handlePriceRangeChange}
              />
            </div>

            {/* Main Content (Products Grid) */}
            <div className="md:col-span-9 lg:col-span-10">
              <ProductGrid 
                category={selectedCategory}
                condition={selectedConditions.length > 0 ? selectedConditions : undefined}
                minPrice={priceRange.min}
                maxPrice={priceRange.max}
                searchQuery={searchQuery}
              />
            </div>
          </div>
          
          {/* Terms Modal */}
          <TermsModal 
            open={showTerms} 
            onClose={() => setShowTerms(false)} 
          />
          
          {/* Sell Item Modal */}
          <SellItemModal 
            open={showSellModal} 
            onClose={() => setShowSellModal(false)} 
          />
          
          {/* Sell Item Button (Fixed) */}
          <div className="fixed bottom-16 md:bottom-6 right-6 z-30">
            <Button 
              className="rounded-full w-14 h-14 bg-[#F76902] hover:bg-[#E15900]"
              onClick={() => setShowSellModal(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          
          {/* Mobile Bottom Navigation */}
          <MobileNavbar />
        </div>
      </div>
    </ChatProvider>
  );
}

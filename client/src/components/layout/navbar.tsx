import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { 
  Search,
  User,
  LogOut,
  Menu,
  MessageSquare,
  ShoppingBag,
  Tag
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Navbar({ onSearch }: { onSearch?: (query: string) => void }) {
  const { user, logoutMutation } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="bg-[#F76902] text-white font-bold text-xl px-2 py-1 rounded">RIT</div>
              <span className="ml-2 text-[#513127] font-bold text-xl">Marketplace</span>
            </div>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <span className="text-[#513127] hover:text-[#F76902] transition cursor-pointer">Browse</span>
            </Link>
            <Link href="/my-listings">
              <span className="text-[#513127] hover:text-[#F76902] transition cursor-pointer">My Listings</span>
            </Link>
            <Link href="/messages">
              <span className="text-[#513127] hover:text-[#F76902] transition cursor-pointer">Messages</span>
            </Link>
          </div>
          
          {/* Right Side */}
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Search items..." 
                    className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F76902] focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              </form>
            </div>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-[#F76902] flex items-center justify-center text-white">
                      {getUserInitials(user.username)}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>{user.username}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href="/my-listings">
                    <DropdownMenuItem>
                      <Tag className="mr-2 h-4 w-4" />
                      <span>My Listings</span>
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/messages">
                    <DropdownMenuItem>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Messages</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search items..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F76902] focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
        </form>
      </div>
      
      {/* Mobile Menu (Expanded) */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex flex-col space-y-3">
            <Link href="/">
              <span className="text-[#513127] hover:text-[#F76902] transition cursor-pointer block py-2">Browse</span>
            </Link>
            <Link href="/my-listings">
              <span className="text-[#513127] hover:text-[#F76902] transition cursor-pointer block py-2">My Listings</span>
            </Link>
            <Link href="/messages">
              <span className="text-[#513127] hover:text-[#F76902] transition cursor-pointer block py-2">Messages</span>
            </Link>
            <button 
              className="text-left text-[#513127] hover:text-[#F76902] transition cursor-pointer block py-2"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

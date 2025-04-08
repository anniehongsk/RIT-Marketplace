import { Link, useLocation } from "wouter";
import { 
  Home, 
  Search, 
  MessageSquare, 
  User
} from "lucide-react";

export default function MobileNavbar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
      <div className="flex justify-around">
        <Link href="/">
          <a className={`flex flex-col items-center py-2 ${isActive('/') ? 'text-[#F76902]' : 'text-gray-500'}`}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        <Link href="/search">
          <a className={`flex flex-col items-center py-2 ${isActive('/search') ? 'text-[#F76902]' : 'text-gray-500'}`}>
            <Search className="h-5 w-5" />
            <span className="text-xs mt-1">Search</span>
          </a>
        </Link>
        <Link href="/messages">
          <a className={`flex flex-col items-center py-2 ${isActive('/messages') ? 'text-[#F76902]' : 'text-gray-500'}`}>
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Messages</span>
          </a>
        </Link>
        <Link href="/my-listings">
          <a className={`flex flex-col items-center py-2 ${isActive('/my-listings') ? 'text-[#F76902]' : 'text-gray-500'}`}>
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </div>
  );
}

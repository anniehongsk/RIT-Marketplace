import { formatDistance } from "date-fns";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  viewMode: "grid" | "list";
}

export default function ProductCard({ product, viewMode }: ProductCardProps) {
  const formatConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
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

  // Default image if no images are provided
  const defaultImage = "https://via.placeholder.com/300x200?text=No+Image";
  const productImage = product.images && product.images.length > 0 ? product.images[0] : defaultImage;

  return (
    <Link href={`/product/${product.id}`}>
      <div className={cn(
        "border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer",
        viewMode === "list" && "flex flex-row"
      )}>
        <div className={cn(
          viewMode === "grid" ? "w-full h-48" : "w-1/3 h-auto"
        )}>
          <img 
            src={productImage} 
            alt={product.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className={cn(
          "p-4",
          viewMode === "list" && "w-2/3"
        )}>
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.title}</h3>
            <span className={cn(
              "text-xs px-2 py-1 rounded",
              formatConditionColor(product.condition)
            )}>
              {product.condition}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg text-[#513127]">{formatPrice(product.price)}</span>
            <span className="text-xs text-gray-500">Posted {formatDate(product.createdAt)}</span>
          </div>
          {product.isSold && (
            <div className="mt-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded text-center">
              SOLD
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

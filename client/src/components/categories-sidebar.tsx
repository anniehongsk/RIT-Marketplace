import {
  Book,
  Monitor,
  Shirt,
  Home,
  PenTool,
  GamepadIcon,
  Bike,
  MoreHorizontal
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CategoriesSidebarProps {
  onCategoryChange: (category: string) => void;
  onConditionChange: (conditions: string[]) => void;
  onPriceRangeChange: (minPrice: number | undefined, maxPrice: number | undefined) => void;
}

export default function CategoriesSidebar({
  onCategoryChange,
  onConditionChange,
  onPriceRangeChange
}: CategoriesSidebarProps) {
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  
  const categories = [
    { name: "Textbooks", icon: <Book className="mr-2 h-4 w-4" /> },
    { name: "Electronics", icon: <Monitor className="mr-2 h-4 w-4" /> },
    { name: "Clothing", icon: <Shirt className="mr-2 h-4 w-4" /> },
    { name: "Furniture", icon: <Home className="mr-2 h-4 w-4" /> },
    { name: "School Supplies", icon: <PenTool className="mr-2 h-4 w-4" /> },
    { name: "Gaming", icon: <GamepadIcon className="mr-2 h-4 w-4" /> },
    { name: "Transportation", icon: <Bike className="mr-2 h-4 w-4" /> },
    { name: "Other", icon: <MoreHorizontal className="mr-2 h-4 w-4" /> },
  ];
  
  const conditions = ["New", "Like New", "Good", "Fair", "Poor"];
  
  const handleCategoryClick = (category: string) => {
    onCategoryChange(category);
  };
  
  const handleConditionChange = (condition: string, checked: boolean) => {
    let updatedConditions: string[];
    
    if (checked) {
      updatedConditions = [...selectedConditions, condition];
    } else {
      updatedConditions = selectedConditions.filter(c => c !== condition);
    }
    
    setSelectedConditions(updatedConditions);
    onConditionChange(updatedConditions);
  };
  
  const handlePriceApply = () => {
    const min = minPrice ? parseInt(minPrice) : undefined;
    const max = maxPrice ? parseInt(maxPrice) : undefined;
    onPriceRangeChange(min, max);
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="font-bold text-lg mb-4 text-[#513127]">Categories</h2>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category.name}>
            <button
              className="flex items-center text-gray-700 hover:text-[#F76902] w-full text-left"
              onClick={() => handleCategoryClick(category.name)}
            >
              {category.icon}
              {category.name}
            </button>
          </li>
        ))}
      </ul>
      
      <hr className="my-4 border-gray-200" />
      
      <h2 className="font-bold text-lg mb-4 text-[#513127]">Price Range</h2>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Input
            type="number"
            placeholder="Min"
            className="w-20 px-2 py-1"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-gray-500 mx-2">to</span>
          <Input
            type="number"
            placeholder="Max"
            className="w-20 px-2 py-1"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200"
          onClick={handlePriceApply}
        >
          Apply
        </Button>
      </div>
      
      <hr className="my-4 border-gray-200" />
      
      <h2 className="font-bold text-lg mb-4 text-[#513127]">Condition</h2>
      <div className="space-y-2">
        {conditions.map((condition) => (
          <div key={condition} className="flex items-center">
            <Checkbox 
              id={`condition-${condition}`} 
              checked={selectedConditions.includes(condition)}
              onCheckedChange={(checked) => 
                handleConditionChange(condition, checked as boolean)
              }
            />
            <Label htmlFor={`condition-${condition}`} className="ml-2 text-gray-700">
              {condition}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

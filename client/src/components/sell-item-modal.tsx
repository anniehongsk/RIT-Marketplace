import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ImagePlus } from "lucide-react";

interface SellItemModalProps {
  open: boolean;
  onClose: () => void;
}

// Extended schema with client-side validation
const formSchema = insertProductSchema.extend({
  price: z.string().min(1, "Price is required").transform((val) => parseInt(val) * 100), // Convert to cents
  images: z.array(z.string()).min(1, "At least one image is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SellItemModal({ open, onClose }: SellItemModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      condition: "New",
      category: "Textbooks",
      location: "",
      images: [],
      allowCampusMeetup: true,
      allowDelivery: false,
      allowPickup: false,
      sellerId: user?.id || 0,
    },
  });
  
  const createProduct = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/products", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-listings"] });
      toast({
        title: "Success",
        description: "Your item has been listed successfully.",
      });
      onClose();
      form.reset();
      setImageUrls([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to list item: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to list an item.",
        variant: "destructive",
      });
      return;
    }
    
    createProduct.mutate({
      ...data,
      sellerId: user.id,
    });
  };
  
  const addImageUrl = () => {
    // For demo purposes, add a placeholder image URL
    // In a real application, this would connect to an upload service
    const placeholderUrls = [
      "https://via.placeholder.com/300/F76902/FFFFFF?text=RIT+Item+1",
      "https://via.placeholder.com/300/513127/FFFFFF?text=RIT+Item+2",
      "https://via.placeholder.com/300/999999/FFFFFF?text=RIT+Item+3",
      "https://via.placeholder.com/300/F76902/FFFFFF?text=RIT+Item+4",
      "https://via.placeholder.com/300/513127/FFFFFF?text=RIT+Item+5"
    ];
    
    const newUrl = placeholderUrls[imageUrls.length % placeholderUrls.length];
    const updatedUrls = [...imageUrls, newUrl];
    setImageUrls(updatedUrls);
    form.setValue("images", updatedUrls);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#513127]">List a New Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Photos</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <div className="flex flex-wrap gap-2 mb-4 justify-center">
                        {imageUrls.map((url, index) => (
                          <img 
                            key={index}
                            src={url}
                            alt={`Item image ${index + 1}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ))}
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={addImageUrl}
                        disabled={imageUrls.length >= 5}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        Add Photo
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">Up to 5 photos</p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TI-84 Plus Graphing Calculator" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Textbooks">Textbooks</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing">Clothing</SelectItem>
                        <SelectItem value="Furniture">Furniture</SelectItem>
                        <SelectItem value="School Supplies">School Supplies</SelectItem>
                        <SelectItem value="Gaming">Gaming</SelectItem>
                        <SelectItem value="Transportation">Transportation</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Meet-up Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Golisano Hall, Dorm, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={4} 
                      placeholder="Describe your item, including any important details potential buyers should know..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div>
              <FormLabel>Delivery Options</FormLabel>
              <div className="space-y-2 mt-2">
                <FormField
                  control={form.control}
                  name="allowCampusMeetup"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Campus Meetup</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allowDelivery"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Delivery (additional details in description)</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="allowPickup"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Pickup (from your location)</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full bg-[#F76902] hover:bg-[#E15900]"
                disabled={createProduct.isPending}
              >
                {createProduct.isPending ? "Listing..." : "List Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

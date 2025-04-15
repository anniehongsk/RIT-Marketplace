import { useState, useRef } from "react";
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
import { ImagePlus, Loader2, X } from "lucide-react";

interface SellItemModalProps {
  open: boolean;
  onClose: () => void;
}

// Extended schema with client-side validation
const formSchema = insertProductSchema.extend({
  price: z.coerce.string().min(1, "Price is required").transform((val) => parseInt(val) * 100), // Convert to cents
  images: z.array(z.string()).min(1, "At least one image is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function SellItemModal({ open, onClose }: SellItemModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "" as unknown as number,
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
  
  // Image upload mutation
  const uploadImage = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Add the new image URLs to the state and form
      const updatedUrls = [...imageUrls, ...data.urls];
      setImageUrls(updatedUrls);
      form.setValue("images", updatedUrls);
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });
  
  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;
    
    // Check if adding these files would exceed the 5 image limit
    if (imageUrls.length + fileList.length > 5) {
      toast({
        title: "Too many images",
        description: `You can only upload a maximum of 5 images. You've selected ${fileList.length} but already have ${imageUrls.length}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Create FormData and append files
    const formData = new FormData();
    Array.from(fileList).forEach(file => {
      formData.append('images', file);
    });
    
    // Upload the files
    setIsUploading(true);
    uploadImage.mutate(formData);
    
    // Reset the file input
    event.target.value = '';
  };
  
  // Remove an image
  const removeImage = (index: number) => {
    const updatedUrls = [...imageUrls];
    updatedUrls.splice(index, 1);
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
                          <div key={index} className="relative w-24 h-24 group">
                            <img 
                              src={url}
                              alt={`Item image ${index + 1}`}
                              className="w-24 h-24 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                            >
                              <X className="h-3 w-3 text-gray-700" />
                            </button>
                          </div>
                        ))}
                        
                        {isUploading && (
                          <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                        multiple
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || imageUrls.length >= 5}
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {imageUrls.length === 0 ? "Add Photos" : "Add More Photos"}
                      </Button>
                      <p className="text-xs text-gray-400 mt-2">Up to 5 photos (JPG, PNG)</p>
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
                          checked={field.value as boolean}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
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
                          checked={field.value as boolean}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
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
                          checked={field.value as boolean}
                          onCheckedChange={(checked) => field.onChange(!!checked)}
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

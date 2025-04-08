import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function TermsModal({ open, onClose }: TermsModalProps) {
  const { acceptTermsMutation } = useAuth();
  const [agreed, setAgreed] = useState(false);
  
  const handleAcceptTerms = () => {
    acceptTermsMutation.mutate();
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#513127]">Terms and Conditions</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-80 pr-2">
          <p className="mb-4 text-sm">Welcome to RIT Marketplace. By using this platform, you agree to the following terms:</p>
          
          <h3 className="font-bold mb-2 text-sm">1. Account Responsibility</h3>
          <p className="mb-4 text-sm">You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
          
          <h3 className="font-bold mb-2 text-sm">2. Code of Conduct</h3>
          <p className="mb-4 text-sm">All transactions must be conducted in accordance with RIT's code of conduct. Any fraudulent, abusive, or otherwise illegal activity may be grounds for termination of your account.</p>
          
          <h3 className="font-bold mb-2 text-sm">3. Prohibited Items</h3>
          <p className="mb-4 text-sm">The following items may not be sold: alcohol, tobacco, drugs, weapons, counterfeit items, stolen property, or any items prohibited by RIT policy or applicable law.</p>
          
          <h3 className="font-bold mb-2 text-sm">4. Transaction Safety</h3>
          <p className="mb-4 text-sm">We recommend meeting in public, populated areas on campus for transactions. The marketplace does not guarantee the safety of transactions or the quality of items.</p>
          
          <h3 className="font-bold mb-2 text-sm">5. Liability Limitation</h3>
          <p className="mb-4 text-sm">RIT Marketplace serves only as a platform connecting buyers and sellers. We are not responsible for disputes between users, item quality, or safety issues arising from transactions.</p>
        </ScrollArea>
        
        <div className="flex items-center mb-4">
          <Checkbox 
            id="terms" 
            checked={agreed} 
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="terms" className="ml-2 text-sm text-gray-700">
            I have read and agree to the Terms and Conditions
          </Label>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAcceptTerms} 
            className="bg-[#F76902] hover:bg-[#E15900]"
            disabled={!agreed || acceptTermsMutation.isPending}
          >
            {acceptTermsMutation.isPending ? "Processing..." : "Accept and Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

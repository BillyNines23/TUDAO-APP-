import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface SquareCheckoutFormProps {
  onSuccess: (licenseId: string) => void;
  amount: number;
  tier: string;
  wallet: string;
  email?: string;
  name?: string;
}

export function SquareCheckoutForm({ onSuccess, amount, tier, wallet, email, name }: SquareCheckoutFormProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [card, setCard] = useState<any>(null);
  const [payments, setPayments] = useState<any>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSquare = async () => {
      if (!window.Square) {
        const script = document.createElement('script');
        // Use sandbox for testing
        script.src = 'https://sandbox.web.squarecdn.com/v1/square.js';
        script.async = true;
        script.onload = () => initializeSquare();
        document.body.appendChild(script);
      } else {
        initializeSquare();
      }
    };

    const initializeSquare = async () => {
      try {
        const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!appId || !locationId) {
          throw new Error('Square credentials not configured');
        }

        const paymentsInstance = window.Square.payments(appId, locationId);
        setPayments(paymentsInstance);

        const cardInstance = await paymentsInstance.card();
        await cardInstance.attach(cardContainerRef.current);
        setCard(cardInstance);
      } catch (error: any) {
        console.error('Square initialization error:', error);
        toast({
          title: "Setup Error",
          description: "Failed to load payment form. Please refresh the page.",
          variant: "destructive",
        });
      }
    };

    loadSquare();

    return () => {
      if (card) {
        card.destroy();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!card) {
      toast({
        title: "Error",
        description: "Payment form not ready. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Tokenize the card
      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        // Send token to backend
        const response = await fetch('/api/square-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: result.token,
            tier,
            amount,
            wallet,
            email,
            name,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment failed');
        }

        const data = await response.json();
        onSuccess(data.licenseId);
      } else {
        // Handle tokenization errors
        const errorMessage = result.errors?.map((e: any) => e.message).join(', ') || 'Card validation failed';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between text-sm pb-4 border-b">
          <span className="text-muted-foreground">Tier</span>
          <span className="font-semibold">{tier}</span>
        </div>
        <div className="flex justify-between text-sm pb-4 border-b">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-semibold text-lg">
            ${amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Square Card Element Container */}
      <div 
        ref={cardContainerRef} 
        id="card-container"
        className="border rounded-md p-4 min-h-[120px]"
      />

      <div className="space-y-3">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={!card || isProcessing}
          data-testid="button-submit-payment"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay $${amount.toLocaleString()}`
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Payments processed securely by Square
        </p>
      </div>
    </form>
  );
}

// Type declarations for Square SDK
declare global {
  interface Window {
    Square?: any;
  }
}

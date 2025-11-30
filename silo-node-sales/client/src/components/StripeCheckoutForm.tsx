// Stripe checkout form component for fiat payments
// Based on blueprint:javascript_stripe
import { useState } from "react";
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface StripeCheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  amount: number;
  tier: string;
}

export function StripeCheckoutForm({ onSuccess, amount, tier }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Payment successful
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
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

      <PaymentElement />

      <div className="space-y-3">
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={!stripe || !elements || isProcessing}
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
          Payments processed securely by Stripe
        </p>
      </div>
    </form>
  );
}

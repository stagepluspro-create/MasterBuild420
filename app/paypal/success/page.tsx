"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { dbService } from "@/lib/db-service";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

function PayPalSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshSubscription } = useAuth();
  const [processing, setProcessing] = useState(true);

  const handlePaymentSuccess = useCallback(async () => {
    if (!user) return;

    try {
      const transactionId = searchParams.get("transaction_id") ||
                           searchParams.get("tx") ||
                           `PP-${Date.now()}`;

      const tier = searchParams.get("tier") as "pro" | "team" || "pro";

      await dbService.updateSubscription(user.id, {
        status: "active",
        tier: tier,
        paypal_transaction_id: transactionId,
      });

      await refreshSubscription();

      setProcessing(false);
    } catch (error) {
      console.error("Failed to update subscription:", error);
      setProcessing(false);
    }
  }, [user, searchParams, refreshSubscription]);

  useEffect(() => {
    if (user) {
      handlePaymentSuccess();
    }
  }, [user, handlePaymentSuccess]);

  return (
    <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto glass-panel p-8 text-center">
        <div className="inline-flex p-4 rounded-full bg-green-500/20 mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">
          {processing
            ? "Processing your payment..."
            : "Your subscription is now active. Welcome to Stage Tech Pro!"}
        </p>
        <Link href="/dashboard">
          <Button className="w-full" disabled={processing}>
            {processing ? "Please wait..." : "Go to Dashboard"}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PayPalSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-28 px-4">
        <div className="max-w-md mx-auto glass-panel p-8">
          <div className="text-center">Processing payment...</div>
        </div>
      </div>
    }>
      <PayPalSuccessContent />
    </Suspense>
  );
}

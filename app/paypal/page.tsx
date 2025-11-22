"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function PayPalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshSubscription, subscription } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = searchParams.get("status");

  useEffect(() => {
    if (!user) {
      setProcessing(false);
      return;
    }

    if (status === "cancel") {
      setProcessing(false);
      return;
    }

    if (status === "success") {
      // For PayPal Subscriptions API, the actual activation happens via webhook
      // This page just confirms the user approved the subscription
      // Poll for subscription updates
      const checkSubscription = async () => {
        try {
          await refreshSubscription();
          setProcessing(false);
        } catch (error) {
          console.error("Failed to refresh subscription:", error);
          setError("Failed to load subscription details");
          setProcessing(false);
        }
      };

      // Initial check
      checkSubscription();

      // Poll every 2 seconds for up to 30 seconds
      let pollCount = 0;
      const maxPolls = 15;
      const pollInterval = setInterval(async () => {
        pollCount++;
        await checkSubscription();

        if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    } else {
      setProcessing(false);
    }
  }, [user, status, refreshSubscription]);

  if (!user) {
    return (
      <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto glass-panel p-8 text-center">
          <p className="text-gray-300 mb-6">Please sign in to continue.</p>
          <Link href="/auth/signin">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "cancel") {
    return (
      <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto glass-panel p-8 text-center">
          <div className="inline-flex p-4 rounded-full bg-yellow-500/20 mb-4">
            <XCircle className="w-12 h-12 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Cancelled</h1>
          <p className="text-gray-300 mb-6">
            You cancelled the subscription process. No charges were made.
          </p>
          <div className="space-y-3">
            <Link href="/profile/subscription">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                Try Again
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto glass-panel p-8 text-center">
          {processing ? (
            <>
              <div className="inline-flex p-4 rounded-full bg-cyan-500/20 mb-4">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Confirming Your Subscription
              </h1>
              <p className="text-gray-300 mb-6">
                Thanks for subscribing! We're confirming your payment with PayPal.
                This may take a few moments...
              </p>
            </>
          ) : error ? (
            <>
              <div className="inline-flex p-4 rounded-full bg-red-500/20 mb-4">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Something Went Wrong</h1>
              <p className="text-gray-300 mb-6">{error}</p>
              <Link href="/profile/subscription">
                <Button className="w-full">View Subscription</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="inline-flex p-4 rounded-full bg-green-500/20 mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-300 mb-2">
                {subscription?.status === "active"
                  ? "Your subscription is now active. Welcome to Stage Tech Pro!"
                  : "Your subscription will be activated shortly."}
              </p>
              {subscription?.status === "trial" && (
                <p className="text-sm text-gray-400 mb-6">
                  You're currently on a free trial. Your subscription will begin after the trial period.
                </p>
              )}
              <div className="space-y-3">
                <Link href="/dashboard">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/profile/subscription">
                  <Button variant="outline" className="w-full">
                    View Subscription Details
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Unknown status
  return (
    <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto glass-panel p-8 text-center">
        <p className="text-gray-300 mb-6">Invalid payment status.</p>
        <Link href="/dashboard">
          <Button className="w-full">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default function PayPalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
          <div className="max-w-md mx-auto glass-panel p-8 text-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <PayPalPageContent />
    </Suspense>
  );
}

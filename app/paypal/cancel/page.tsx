import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PayPalCancel() {
  return (
    <div className="min-h-screen pt-28 px-4 flex items-center justify-center">
      <div className="max-w-md mx-auto glass-panel p-8 text-center">
        <div className="inline-flex p-4 rounded-full bg-gray-500/20 mb-4">
          <XCircle className="w-12 h-12 text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Payment Canceled</h1>
        <p className="text-gray-300 mb-6">
          Your payment was canceled. You can try again anytime.
        </p>
        <div className="flex gap-2">
          <Link href="/#pricing" className="flex-1">
            <Button variant="outline" className="w-full">
              View Pricing
            </Button>
          </Link>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

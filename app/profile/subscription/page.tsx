"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { BillingSubscription } from "@/components/teams/billing-subscription";

export default function SubscriptionPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: sub } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: members } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", user.id);

      setSubscription(sub);
      setMemberCount(members?.length || 0);
      setLoading(false);
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-300">
        Loading subscription...
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-10 text-center text-gray-300">
        No active subscription found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <BillingSubscription
        subscription={subscription}
        memberCount={memberCount}
        onUpgrade={() => console.log("upgrade")}
        onDowngrade={() => console.log("downgrade")}
        onManagePayment={() => console.log("manage payment")}
      />
    </div>
  );
}
